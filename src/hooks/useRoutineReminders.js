import { useEffect, useRef } from 'react'

// Dispara notificações do navegador enquanto o app está aberto (em alguma
// aba), pros itens de rotina que têm horário definido e ainda não foram
// marcados como feitos hoje. Não funciona com o app fechado — isso exigiria
// Web Push + service worker + servidor disparando no horário certo.
export function useRoutineReminders(data, todayKey, todayWeekday, todayCompletions) {
  const firedRef = useRef(new Set())

  // Reseta os avisos já disparados sempre que o dia muda.
  useEffect(() => {
    firedRef.current = new Set()
  }, [todayKey])

  useEffect(() => {
    if (!data) return

    function check() {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') return
      if (Notification.permission !== 'granted') return

      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      data.checklistItems
        .filter(i => i.kind === 'rotina' && i.time && (i.weekday === todayWeekday || i.weekday === null || i.weekday === undefined))
        .forEach(item => {
          const fireKey = `${todayKey}-${item.id}`
          const alreadyDone = Boolean(todayCompletions[item.id])
          const alreadyFired = firedRef.current.has(fireKey)

          if (item.time <= hhmm && !alreadyDone && !alreadyFired) {
            firedRef.current.add(fireKey)
            try {
              new Notification('Nexa — hora da rotina', {
                body: item.text,
                tag: fireKey,
                icon: '/icon-192.png'
              })
            } catch {
              // navegador pode bloquear silenciosamente, sem problema
            }
          }
        })
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [data, todayKey, todayWeekday, todayCompletions])
}

export function requestReminderPermission() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return Promise.resolve('unsupported')
  }
  return Notification.requestPermission()
}

export function reminderPermissionStatus() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}