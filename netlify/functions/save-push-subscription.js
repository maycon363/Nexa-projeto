import { supabaseAdmin, getVerifiedUser, jsonResponse } from '../lib/supabaseAdmin.js'

export async function handler(event) {
  const { user, error: authError } = await getVerifiedUser(event)
  if (!user) return jsonResponse(401, { error: authError })

  if (event.httpMethod === 'DELETE') {
    const { endpoint } = event.body ? JSON.parse(event.body) : {}
    if (!endpoint) return jsonResponse(400, { error: 'endpoint é obrigatório' })

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) return jsonResponse(500, { error: error.message })
    return jsonResponse(200, { ok: true })
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const { subscription } = event.body ? JSON.parse(event.body) : {}
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return jsonResponse(400, { error: 'Inscrição de push inválida.' })
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      { onConflict: 'endpoint' }
    )

  if (error) return jsonResponse(500, { error: error.message })
  return jsonResponse(200, { ok: true })
}