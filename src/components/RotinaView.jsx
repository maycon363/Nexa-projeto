import { useState } from 'react'

const PERIODS = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' }
]

function RotinaItemRow({ item, done, isFirst, isLast, onToggle, onEditText, onMoveUp, onMoveDown, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.text) onEditText(trimmed)
    else setDraft(item.text)
    setEditing(false)
  }

  return (
    <li className="checklist-item">
      <button
        className={`check-box${done ? ' checked' : ''}`}
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? 'Marcar como não feito' : 'Marcar como feito'}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.2 8.2L11 1" stroke="var(--color-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="item-body">
        {editing ? (
          <input
            className="item-edit-input"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setDraft(item.text); setEditing(false) }
            }}
          />
        ) : (
          <div className={`item-text${done ? ' done' : ''}`} onClick={() => setEditing(true)} title="Clique para editar">
            {item.text}
          </div>
        )}
      </div>

      <div className="item-actions">
        <button className="item-move" onClick={onMoveUp} disabled={isFirst} title="Mover pra cima">▲</button>
        <button className="item-move" onClick={onMoveDown} disabled={isLast} title="Mover pra baixo">▼</button>
        <button className="item-remove" onClick={onRemove} title="Remover item">✕</button>
      </div>
    </li>
  )
}

export default function RotinaView({ items, weekday, completions, onToggle, onAddItem, onRemoveItem, onEditText, onMoveItem }) {
  return (
    <div>
      {PERIODS.map(period => {
        const periodItems = items.filter(i => i.period === period.id && (i.weekday === weekday || i.weekday === null || i.weekday === undefined))
        if (periodItems.length === 0) return null
        return (
          <div className="period-block" key={period.id}>
            <h3 className="period-title">{period.label}</h3>
            <ul className="checklist">
              {periodItems.map((item, i) => (
                <RotinaItemRow
                  key={item.id}
                  item={item}
                  done={Boolean(completions[item.id])}
                  isFirst={i === 0}
                  isLast={i === periodItems.length - 1}
                  onToggle={() => onToggle(item.id)}
                  onEditText={(text) => onEditText(item.id, text)}
                  onMoveUp={() => onMoveItem(item.id, 'up')}
                  onMoveDown={() => onMoveItem(item.id, 'down')}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))}
            </ul>
          </div>
        )
      })}

      <AddRotinaItemForm onAdd={onAddItem} weekday={weekday} />
    </div>
  )
}

function AddRotinaItemForm({ onAdd, weekday }) {
  const [text, setText] = useState('')
  const [period, setPeriod] = useState('manha')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(period, text.trim(), weekday)
    setText('')
  }

  return (
    <form className="add-item-row" onSubmit={submit}>
      <select className="type-select" value={period} onChange={e => setPeriod(e.target.value)}>
        {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <input
        type="text"
        placeholder="Novo item da rotina…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button type="submit">Adicionar</button>
    </form>
  )
}