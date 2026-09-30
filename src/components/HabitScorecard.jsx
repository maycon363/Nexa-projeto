import { useState } from 'react'
import { TrashIcon, SparkleIcon } from './Icons.jsx'
import { classifyHabitWithAI } from '../services/aiService.js'

const TAG = {
  bom: { label: 'Bom', tone: 'strong' },
  ruim: { label: 'Ruim', tone: 'critical' },
  neutro: { label: 'Neutro', tone: 'neutral' }
}

function HabitRow({ habit, onClassify, onRemove }) {
  const [busy, setBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const tag = habit.classification ? TAG[habit.classification] : null

  async function askAI() {
    setBusy(true)
    setAiError('')
    try {
      const result = await classifyHabitWithAI(habit.text)
      onClassify(habit.id, result.classification, 'ia', result.reason)
    } catch (err) {
      setAiError(err.message || 'Não consegui analisar agora, tenta de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="habit-scorecard-row">
      <div className="habit-scorecard-row-main">
        <span className="habit-scorecard-text">{habit.text}</span>
        {tag && <span className={`habit-map-tag tone-${tag.tone}`}>{tag.label}</span>}
      </div>

      {habit.note && <p className="habit-scorecard-note">{habit.note}</p>}
      {aiError && <p className="habit-scorecard-note tone-critical-text">{aiError}</p>}

      <div className="habit-scorecard-actions">
        <button
          className={`habit-scorecard-pill${habit.classification === 'bom' ? ' active' : ''}`}
          onClick={() => onClassify(habit.id, 'bom', 'manual')}
        >
          Bom
        </button>
        <button
          className={`habit-scorecard-pill${habit.classification === 'ruim' ? ' active' : ''}`}
          onClick={() => onClassify(habit.id, 'ruim', 'manual')}
        >
          Ruim
        </button>
        <button
          className={`habit-scorecard-pill${habit.classification === 'neutro' ? ' active' : ''}`}
          onClick={() => onClassify(habit.id, 'neutro', 'manual')}
        >
          Neutro
        </button>
        <button className="habit-scorecard-pill habit-scorecard-ai" onClick={askAI} disabled={busy}>
          <SparkleIcon size={13} /> {busy ? 'Analisando…' : 'Perguntar à IA'}
        </button>
        <button className="item-remove" onClick={() => onRemove(habit.id)} title="Remover hábito">
          <TrashIcon />
        </button>
      </div>
    </li>
  )
}

// Como no livro (Hábitos Atômicos, cap. "O cartão dos hábitos"): a pessoa só
// lista o que ela faz no automático, sem filtro, e depois marca se aquilo
// ajuda ou atrapalha quem ela quer ser. Ex.: "lavar as mãos depois do
// banheiro" entra aqui igual a "ficar no celular até tarde".
export default function HabitScorecard({ habits, onAdd, onClassify, onRemove }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  const goodCount = habits.filter(h => h.classification === 'bom').length
  const badCount = habits.filter(h => h.classification === 'ruim').length

  return (
    <section className="value-section habit-scorecard">
      <div className="value-section-head">
        <div>
          <h2>Mapeamento de hábitos</h2>
          <p>Liste qualquer hábito seu, automático, sem filtro. Depois classifique (ou deixe a IA sugerir) se ele te aproxima ou te afasta de quem você quer ser.</p>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="habit-map-summary">
          <span className="habit-map-summary-value">{goodCount}</span>
          <span className="habit-map-summary-label">bons · {badCount} ruins · {habits.length} no total</span>
        </div>
      )}

      {habits.length === 0 && (
        <p className="empty-state">
          Ainda não tem nenhum hábito listado aqui. Ex: "lavar as mãos depois de ir ao banheiro" ou "mexer no celular assim que acordo".
        </p>
      )}

      <ul className="checklist habit-scorecard-list">
        {habits.map(h => (
          <HabitRow key={h.id} habit={h} onClassify={onClassify} onRemove={onRemove} />
        ))}
      </ul>

      <form className="add-item-row" onSubmit={submit}>
        <input
          type="text"
          placeholder="Ex: lavar as mãos depois do banheiro…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit">Adicionar</button>
      </form>
    </section>
  )
}