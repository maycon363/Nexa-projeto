import { useState } from 'react'
import { EditIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, ClockIcon, CloseIcon } from './Icons.jsx'

const PERIODS = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' }
]

// Campo de horário próprio: o que aparece na tela é sempre o mesmo, em
// qualquer navegador/celular — um pill com nosso ícone de relógio. Por baixo,
// um <input type="time"> de verdade fica invisível cobrindo o pill, então
// tocar nele abre o seletor nativo do sistema (isso sim funciona igual em
// qualquer lugar, já que é um clique direto no controle real).
function TimeField({ value, onChange, ariaLabel }) {
  return (
    <span className={`time-field${value ? ' has-value' : ''}`}>
      <ClockIcon size={12} />
      <span className="time-field-label">{value || 'Horário'}</span>
      <input
        type="time"
        className="time-field-input"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          className="time-field-clear"
          onClick={() => onChange('')}
          aria-label="Remover horário"
          title="Remover horário"
        >
          <CloseIcon size={9} />
        </button>
      )}
    </span>
  )
}

function RotinaItemRow({ item, done, isFirst, isLast, onToggle, onEditText, onEditTime, onMoveUp, onMoveDown, onRemove }) {
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
        <TimeField
          value={item.time || ''}
          onChange={onEditTime}
          ariaLabel={`Horário do lembrete para ${item.text}`}
        />
        <button className="item-move" onClick={onMoveUp} disabled={isFirst} title="Mover pra cima"><ArrowUpIcon /></button>
        <button className="item-move" onClick={onMoveDown} disabled={isLast} title="Mover pra baixo"><ArrowDownIcon /></button>
        <button className="item-remove" onClick={onRemove} title="Remover item"><TrashIcon /></button>
      </div>
    </li>
  )
}

export default function RotinaView({ items, weekday, completions, onToggle, onAddItem, onRemoveItem, onEditText, onEditTime, onMoveItem }) {
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
                  onEditTime={(time) => onEditTime(item.id, time)}
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
  const [time, setTime] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(period, text.trim(), weekday, time || null)
    setText('')
    setTime('')
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
      <TimeField value={time} onChange={setTime} ariaLabel="Horário do lembrete (opcional)" />
      <button type="submit">Adicionar</button>
    </form>
  )
}