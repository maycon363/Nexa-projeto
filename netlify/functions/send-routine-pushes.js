import webpush from 'web-push'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@example.com'
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

function nowInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
  }).formatToParts(new Date())

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return {
    dayKey: `${map.year}-${map.month}-${map.day}`,
    hhmm: `${map.hour}:${map.minute}`,
    weekday: weekdayMap[map.weekday]
  }
}

export async function handler() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys ausentes — pulando envio de push.')
    return { statusCode: 200, body: 'skip' }
  }

  const { dayKey, hhmm, weekday } = nowInSaoPaulo()
  console.log(`[send-routine-pushes] rodando às ${hhmm} (dia ${dayKey}, weekday ${weekday})`)

  const { data: rows, error } = await supabaseAdmin
    .from('nexa_data')
    .select('user_id, data')

  if (error) {
    console.error('Erro ao ler nexa_data:', error.message)
    return { statusCode: 500, body: error.message }
  }

  let matchedItems = 0
  let sentPushes = 0
  let removedStale = 0

  for (const row of rows || []) {
    const items = (row.data?.checklistItems || []).filter(i =>
      i.kind === 'rotina' &&
      i.time === hhmm &&
      (i.weekday === weekday || i.weekday === null || i.weekday === undefined)
    )
    if (items.length === 0) continue

    const dayCompletions = row.data?.dailyCycles?.[dayKey]?.completions || {}
    const pending = items.filter(i => !dayCompletions[i.id])
    if (pending.length === 0) continue

    matchedItems += pending.length

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', row.user_id)

    if (!subs || subs.length === 0) {
      console.log(`[send-routine-pushes] usuário ${row.user_id} tem item pendente mas nenhuma inscrição salva`)
      continue
    }

    for (const item of pending) {
      // A chave de duplicidade agora inclui o horário do lembrete — assim,
      // se o usuário editar o horário de um item existente, o push volta a
      // disparar normalmente, em vez de ficar bloqueado por um envio
      // anterior daquele mesmo item em outro horário no mesmo dia.
      const { error: logError } = await supabaseAdmin
        .from('push_reminder_log')
        .insert({ user_id: row.user_id, item_id: item.id, day_key: dayKey, reminder_time: item.time })

      if (logError) continue // esse item + esse horário + esse dia já foi enviado — pula

      const payload = JSON.stringify({
        title: 'Nexa — hora da rotina',
        body: item.text,
        tag: `${dayKey}-${item.id}-${item.time}`,
        url: '/'
      })

      for (const sub of subs) {
        const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
        try {
          await webpush.sendNotification(pushSub, payload)
          sentPushes++
          console.log(`[send-routine-pushes] push enviado: user ${row.user_id}, item ${item.id}, horário ${item.time}, endpoint ${sub.endpoint.slice(0, 60)}…`)
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            removedStale++
            console.log(`[send-routine-pushes] inscrição expirada removida: ${sub.endpoint.slice(0, 60)}…`)
          } else {
            console.error(`[send-routine-pushes] erro ao enviar push (status ${err.statusCode}):`, err.message)
          }
        }
      }
    }
  }

  console.log(`[send-routine-pushes] fim — itens pendentes: ${matchedItems}, pushes enviados: ${sentPushes}, inscrições removidas: ${removedStale}`)

  return { statusCode: 200, body: 'ok' }
}