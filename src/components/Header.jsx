function formatRange(cycleKeyStr) {
  const start = new Date(cycleKeyStr + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(start)} — ${fmt(end)}`
}

export default function Header({ cycleKey }) {
  return (
    <header className="app-header">
      <p className="eyebrow">Ciclo de 7 dias</p>
      <h1>Provas</h1>
      <p className="cycle-range">Semana de {formatRange(cycleKey)}</p>
    </header>
  )
}
