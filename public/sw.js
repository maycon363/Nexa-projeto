// Service worker: fica escutando pushes mesmo com o app fechado/minimizado.
// Precisa estar na raiz pública pra ter escopo do site inteiro.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'Nexa', body: 'Hora da sua rotina.' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // se não vier JSON, usa o padrão acima
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'nexa-reminder',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100]
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
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