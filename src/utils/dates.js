export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function pad(n) { return String(n).padStart(2, '0') }
export function toKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

export function getWeekDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday)
    day.setDate(sunday.getDate() + i)
    return {
      key: toKey(day),
      weekday: i,
      label: WEEKDAY_LABELS[i],
      short: WEEKDAY_LABELS[i].slice(0, 3),
      isToday: toKey(day) === toKey(today)
    }
  })
}