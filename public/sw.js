// Service worker: fica escutando pushes mesmo com o app fechado/minimizado.
// Precisa estar na raiz pública pra ter escopo do site inteiro.

const VAPID_PUBLIC_KEY_URL = '/.netlify/functions/vapid-public-key'
const SAVE_SUBSCRIPTION_URL = '/.netlify/functions/save-push-subscription'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('[sw] push event recebido', event)

  let payload = { title: 'Nexa', body: 'Hora da sua rotina.' }
  try {
    if (event.data) payload = event.data.json()
  } catch (err) {
    console.error('[sw] falha ao ler payload do push', err)
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag: payload.tag || 'nexa-reminder',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100]
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
      .then(() => console.log('[sw] notificação exibida com sucesso'))
      .catch(err => console.error('[sw] erro ao exibir notificação', err))
  )
})

// Clicar na notificação foca uma aba já aberta do app, ou abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

// O navegador pode invalidar a inscrição sozinho (rotação de segurança) —
// sem isso, a inscrição morre silenciosamente e nenhum push chega mais,
// sem nenhum erro visível pro usuário nem pra nós.
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[sw] pushsubscriptionchange disparado, re-inscrevendo…')

  event.waitUntil(
    (async () => {
      try {
        const keyRes = await fetch(VAPID_PUBLIC_KEY_URL)
        const { publicKey } = await keyRes.json()

        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })

        // Reenvia pro backend salvar a inscrição atualizada. Como não temos
        // o token de auth do usuário aqui dentro do service worker, isso só
        // funciona se save-push-subscription aceitar identificar o usuário
        // de outra forma — por enquanto, log de aviso: o app deve chamar
        // enablePushNotifications() de novo na próxima vez que for aberto.
        console.log('[sw] nova inscrição gerada', newSubscription.endpoint)
      } catch (err) {
        console.error('[sw] falha ao re-inscrever após pushsubscriptionchange', err)
      }
    })()
  )
})