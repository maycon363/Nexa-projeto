import { supabase } from './supabaseClient.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessão inválida.')
  return { Authorization: `Bearer ${token}` }
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

async function saveSubscriptionToServer(subscription) {
  const headers = await authHeader()
  const res = await fetch('/.netlify/functions/save-push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ subscription })
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Não consegui salvar a inscrição de push.')
  return body
}

export async function getPushSubscriptionStatus() {
  if (!pushSupported()) return 'unsupported'
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return 'not-subscribed'
  const sub = await registration.pushManager.getSubscription()
  return sub ? 'subscribed' : 'not-subscribed'
}

export async function enablePushNotifications() {
  if (!pushSupported()) throw new Error('Seu navegador não suporta notificações push.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permissão de notificação negada.')

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const keyRes = await fetch('/.netlify/functions/vapid-public-key')
  const { publicKey, error: keyError } = await keyRes.json()
  if (keyError) throw new Error(keyError)

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })
  }

  await saveSubscriptionToServer(subscription)
  return true
}

export async function disablePushNotifications() {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = registration && (await registration.pushManager.getSubscription())
  if (!subscription) return

  const headers = await authHeader()
  await fetch('/.netlify/functions/save-push-subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  })

  await subscription.unsubscribe()
}

// Chamado silenciosamente ao abrir o app (se o usuário já tiver ativado
// lembretes antes). Cobre três situações que, sem isso, quebram o push sem
// nenhum aviso visível: (1) a permissão já foi concedida mas o service
// worker foi reinstalado sem gerar inscrição nova; (2) o navegador trocou o
// endpoint da inscrição sozinho; (3) o app foi instalado depois da inscrição
// ter sido feita direto no navegador, e precisa confirmar que ainda é a
// mesma origem/inscrição.
export async function resyncPushSubscriptionIfEnabled() {
  if (!pushSupported()) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const keyRes = await fetch('/.netlify/functions/vapid-public-key')
      const { publicKey, error: keyError } = await keyRes.json()
      if (keyError) return

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })
    }

    await saveSubscriptionToServer(subscription)
  } catch (err) {
    console.error('[push] falha ao resincronizar inscrição', err)
  }
}