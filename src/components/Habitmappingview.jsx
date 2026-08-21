import { useMemo } from 'react'

const RANGE_DAYS = 30

function pad(n) { return String(n).padStart(2, '0') }
function toDateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Últimos N dias, do mais recente pro mais antigo (hoje incluso).
function lastNDays(n) {
  const out = []
  const base = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    out.push({ key: toDateKey(d), weekday: d.getDay() })
  }
  return out
}

// Sequência atual: quantos dias seguidos (a partir de hoje, pra trás) o
// hábito foi cumprido, parando no primeiro dia em que faltou.
function currentStreak(entries) {
  let streak = 0
  for (const e of entries) {
    if (e.completed) streak += 1
    else break
  }
  return streak
}

function feedbackFor(rate, sampleSize) {
  if (sampleSize === 0) {
    return {
      tag: 'Sem histórico ainda',
      tone: 'neutral',
      text: 'Esse hábito é novo demais pra avaliar. Volte aqui depois de marcar alguns dias.'
    }
  }
  if (rate >= 0.8) {
    return {
      tag: 'Hábito consolidado',
      tone: 'strong',
      text: 'Você já provou, repetidamente, que é alguém que faz isso, identidade se constrói assim, um voto de cada vez.'
    }
  }
  if (rate >= 0.5) {
    return {
      tag: 'Em construção',
      tone: 'building',
      text: 'A consistência está criando raiz. Tente encaixar esse hábito logo depois de algo que você já faz sem pensar, todos os dias.'
    }
  }
  if (rate >= 0.2) {
    return {
      tag: 'Ainda instável',
      tone: 'weak',
      text: 'Ainda não é automático. Tente a versão de 2 minutos dele, menor e mais fácil de começar do que a versão "perfeita".'
    }
  }
  return {
    tag: 'Precisa de empurrão',
    tone: 'critical',
    text: 'Esse hábito está pedindo menos fricção: deixe o ambiente pronto com antecedência ou vincule ele a algo que já é automático no seu dia.'
  }
}

function useHabitStats(data) {
  return useMemo(() => {
    const days = lastNDays(RANGE_DAYS)
    const habits = data.checklistItems.filter(i => i.kind === 'rotina' && !i.parentId)

    const stats = habits.map(habit => {
      const applicableDays = days.filter(d => habit.weekday == null || habit.weekday === d.weekday)
      const entries = applicableDays.map(d => ({
        key: d.key,
        completed: Boolean(data.dailyCycles[d.key]?.completions?.[habit.id])
      }))
      const total = entries.length
      const done = entries.filter(e => e.completed).length
      const rate = total ? done / total : 0
      const streak = currentStreak(entries)
      return { habit, done, total, rate, streak, feedback: feedbackFor(rate, total) }
    })

    stats.sort((a, b) => {
      if (a.total === 0 && b.total === 0) return 0
      if (a.total === 0) return 1
      if (b.total === 0) return -1
      return b.rate - a.rate
    })

    const withData = stats.filter(s => s.total > 0)
    const avgPct = withData.length
      ? Math.round((withData.reduce((sum, s) => sum + s.rate, 0) / withData.length) * 100)
      : null

    return { stats, avgPct }
  }, [data])
}

function HabitCard({ stat }) {
  const { habit, done, total, rate, streak, feedback } = stat
  const pct = total ? Math.round(rate * 100) : null

  return (
    <div className={`habit-map-card tone-${feedback.tone}`}>
      <div className="habit-map-card-head">
        <span className="habit-map-card-name">{habit.text}</span>
        <span className={`habit-map-tag tone-${feedback.tone}`}>{feedback.tag}</span>
      </div>

      {total > 0 ? (
        <>
          <div className="habit-map-bar-track">
            <div className="habit-map-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="habit-map-card-meta">
            <span>{done}/{total} dias · {pct}%</span>
            {streak > 0 && <span>🔥 {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>}
          </div>
        </>
      ) : (
        <div className="habit-map-card-meta"><span>Ainda sem dias suficientes registrados</span></div>
      )}

      <p className="habit-map-card-feedback">{feedback.text}</p>
    </div>
  )
}

export default function HabitMappingView({ data }) {
  const { stats, avgPct } = useHabitStats(data)

  return (
    <div>
      <h2 className="today-group-title">Mapeamento de hábitos</h2>
      <p className="habit-map-intro">
        Como cada hábito de rotina se comportou nos últimos {RANGE_DAYS} dias, não é só uma
        porcentagem, é um retrato do tipo de pessoa que suas ações repetidas estão construindo.
      </p>

      {stats.length === 0 && (
        <p className="empty-state">
          Você ainda não tem itens de rotina cadastrados. Adicione alguns na aba "Hoje" pra ver o
          mapeamento aparecer aqui.
        </p>
      )}

      {avgPct !== null && (
        <div className="habit-map-summary">
          <span className="habit-map-summary-value">{avgPct}%</span>
          <span className="habit-map-summary-label">consistência média entre os hábitos com histórico</span>
        </div>
      )}

      {stats.length > 0 && (
        <div className="habit-map-grid">
          {stats.map(s => <HabitCard key={s.habit.id} stat={s} />)}
        </div>
      )}
    </div>
  )
}