function computeValueDiagnostics(data, dayKeys) {
  return data.values.map(value => {
    const items = data.checklistItems.filter(i => i.kind === 'valor' && i.valueId === value.id)
    if (items.length === 0 || dayKeys.length === 0) return { value, pct: null, done: 0, total: 0 }

    let done = 0
    const total = items.length * dayKeys.length

    dayKeys.forEach(key => {
      const completions = data.dailyCycles[key]?.completions || {}
      items.forEach(item => {
        if (completions[item.id]) done += 1
      })
    })

    const pct = Math.round((done / total) * 100)
    return { value, pct, done, total }
  })
}

function weekStartKey(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(weekStart) {
  const d = new Date(weekStart + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function computeWeeklyStats(data, dayKeys) {
  const weeks = {}

  dayKeys.forEach(key => {
    const day = data.dailyCycles[key]
    const weekday = new Date(key + 'T00:00:00').getDay()
    const rotinaItems = data.checklistItems.filter(i => i.kind === 'rotina' && i.weekday === weekday)
    const valorItems = data.checklistItems.filter(i => i.kind === 'valor')

    const wStart = weekStartKey(key)
    if (!weeks[wStart]) weeks[wStart] = { rotinaDone: 0, rotinaTotal: 0, valorDone: 0, valorTotal: 0 }

    weeks[wStart].rotinaDone += rotinaItems.filter(i => day.completions[i.id]).length
    weeks[wStart].rotinaTotal += rotinaItems.length
    weeks[wStart].valorDone += valorItems.filter(i => day.completions[i.id]).length
    weeks[wStart].valorTotal += valorItems.length
  })

  return Object.entries(weeks)
    .map(([weekStart, v]) => ({
      weekStart,
      rotinaPct: v.rotinaTotal ? Math.round((v.rotinaDone / v.rotinaTotal) * 100) : null,
      valorPct: v.valorTotal ? Math.round((v.valorDone / v.valorTotal) * 100) : null
    }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
}

function pctColor(pct) {
  const hue = Math.max(0, Math.min(120, (pct / 100) * 120))
  return `hsl(${hue}, 62%, 54%)`
}

function DiagnosticCard({ pct, name, done, total }) {
  const color = pctColor(pct)
  return (
    <div className="diag-card" style={{ borderColor: color }}>
      <svg className="diag-ring" width="52" height="52" viewBox="0 0 52 52">
        <circle className="diag-ring-bg" cx="26" cy="26" r="22" fill="none" strokeWidth="5" />
        <circle
          cx="26" cy="26" r="22" fill="none" strokeWidth="5"
          strokeDasharray={2 * Math.PI * 22}
          strokeDashoffset={2 * Math.PI * 22 * (1 - pct / 100)}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ stroke: color, transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="26" y="30" textAnchor="middle" className="diag-ring-text" style={{ fill: color }}>{pct}%</text>
      </svg>
      <div className="diag-card-body">
        <span className="diag-card-name">{name}</span>
        <span className="diag-card-meta">{done}/{total} marcações</span>
      </div>
    </div>
  )
}

function CompareCard({ label, current, previous }) {
  const hasCurrent = current !== null && current !== undefined
  const hasPrevious = previous !== null && previous !== undefined
  const delta = hasCurrent && hasPrevious ? current - previous : null

  return (
    <div className="compare-card">
      <span className="compare-card-label">{label}</span>
      <div className="compare-card-main">
        <span className="compare-card-pct">{hasCurrent ? `${current}%` : '—'}</span>
        {delta !== null && (
          <span className={`compare-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '·'} {Math.abs(delta)}pp
          </span>
        )}
      </div>
      <span className="compare-card-meta">
        {hasPrevious ? `Semana passada: ${previous}%` : 'Sem dados da semana passada ainda'}
      </span>
    </div>
  )
}

export default function HistoryView({ data }) {
  const dayKeys = Object.keys(data.dailyCycles).sort((a, b) => b.localeCompare(a))
  const recentDayKeys = dayKeys.slice(0, 30)
  const diagnostics = computeValueDiagnostics(data, recentDayKeys)
  const withData = diagnostics.filter(d => d.pct !== null).sort((a, b) => b.pct - a.pct)

  const strong = withData.filter(d => d.pct >= 60)
  const developing = withData.filter(d => d.pct < 60)

  const weeklyStats = computeWeeklyStats(data, dayKeys)
  const [thisWeek, lastWeek] = weeklyStats

  return (
    <div>
      <h2 className="today-group-title">Diagnóstico de valores</h2>

      {withData.length === 0 && (
        <p className="empty-state">Marque alguns itens de valores pra ver o diagnóstico aparecer aqui.</p>
      )}

      {withData.length > 0 && (
        <>
          <p style={{ color: 'var(--color-gray)', fontSize: 13, margin: '0 0 18px' }}>
            Com base nos últimos {recentDayKeys.length > 1 ? `${recentDayKeys.length} dias` : 'dias registrados'}. Atualiza sozinho conforme você marca itens ou adiciona novos.
          </p>

          {strong.length > 0 && (
            <div className="today-group">
              <h3 className="diag-section-title">🌱 Pontos fortes</h3>
              <div className="diag-grid">
                {strong.map(d => (
                  <DiagnosticCard key={d.value.id} pct={d.pct} name={d.value.name} done={d.done} total={d.total} />
                ))}
              </div>
            </div>
          )}

          {developing.length > 0 && (
            <div className="today-group">
              <h3 className="diag-section-title">🎯 A desenvolver</h3>
              <div className="diag-grid">
                {developing.map(d => (
                  <DiagnosticCard key={d.value.id} pct={d.pct} name={d.value.name} done={d.done} total={d.total} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="today-group-title">Comparação semanal</h2>
      {!thisWeek ? (
        <p className="empty-state">Ainda não há semana suficiente registrada pra comparar.</p>
      ) : (
        <>
          <div className="compare-grid">
            <CompareCard label="Rotina" current={thisWeek.rotinaPct} previous={lastWeek?.rotinaPct} />
            <CompareCard label="Valores" current={thisWeek.valorPct} previous={lastWeek?.valorPct} />
          </div>

          {weeklyStats.length > 1 && (
            <div className="value-section">
              <h3 className="diag-section-title" style={{ marginBottom: 14 }}>Últimas semanas</h3>
              {weeklyStats.slice(0, 6).map(w => (
                <div className="trend-row" key={w.weekStart}>
                  <span className="trend-row-label">Semana de {formatWeekLabel(w.weekStart)}</span>
                  <div className="trend-row-bars">
                    <div className="trend-bar-track" title={`Rotina: ${w.rotinaPct ?? 0}%`}>
                      <div className="trend-bar-fill rotina" style={{ width: `${w.rotinaPct ?? 0}%` }} />
                    </div>
                    <div className="trend-bar-track" title={`Valores: ${w.valorPct ?? 0}%`}>
                      <div className="trend-bar-fill valores" style={{ width: `${w.valorPct ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="trend-legend">
                <span><span className="trend-dot rotina" /> Rotina</span>
                <span><span className="trend-dot valores" /> Valores</span>
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="today-group-title">Dias registrados</h2>
      {dayKeys.length === 0 && <p className="empty-state">Ainda não há dias registrados.</p>}
      {dayKeys.slice(0, 21).map(key => {
        const day = data.dailyCycles[key]
        const weekday = new Date(key + 'T00:00:00').getDay()
        const rotinaItems = data.checklistItems.filter(i => i.kind === 'rotina' && i.weekday === weekday)
        const valorItems = data.checklistItems.filter(i => i.kind === 'valor')

        const rotinaDone = rotinaItems.filter(i => day.completions[i.id]).length
        const valorDone = valorItems.filter(i => day.completions[i.id]).length

        const rotinaPct = rotinaItems.length ? Math.round((rotinaDone / rotinaItems.length) * 100) : null
        const valorPct = valorItems.length ? Math.round((valorDone / valorItems.length) * 100) : null

        return (
          <section className="value-section" key={key}>
            <div className="value-section-head">
              <div>
                <h2>{key}</h2>
                <p>
                  {rotinaPct !== null && <>Rotina: {rotinaDone}/{rotinaItems.length} ({rotinaPct}%)</>}
                  {rotinaPct !== null && valorPct !== null && ' · '}
                  {valorPct !== null && <>Valores: {valorDone}/{valorItems.length} ({valorPct}%)</>}
                  {rotinaPct === null && valorPct === null && 'Nenhum item registrado'}
                </p>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}