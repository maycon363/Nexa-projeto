import { useState } from 'react'
import { EditIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon } from './Icons.jsx'

export default function ChecklistItem({ item, done, note, isFirst, isLast, onToggle, onNoteChange, onEditText, onMoveUp, onMoveDown, onRemove }) {
  const [showNote, setShowNote] = useState(Boolean(note))
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
          <div className={`item-text${done ? ' done' : ''}`} onClick={() => setShowNote(s => !s)} title="Clique para abrir a nota">
            {item.text}
          </div>
        )}
        {showNote && !editing && (
          <textarea
            className="item-note"
            rows={2}
            placeholder="Registrar a prova disso hoje (opcional)…"
            value={note || ''}
            onChange={e => onNoteChange(e.target.value)}
          />
        )}
      </div>

      <div className="item-actions">
        <button className="item-edit" onClick={() => setEditing(true)} title="Editar texto"><EditIcon /></button>
        <button className="item-move" onClick={onMoveUp} disabled={isFirst} title="Mover pra cima"><ArrowUpIcon /></button>
        <button className="item-move" onClick={onMoveDown} disabled={isLast} title="Mover pra baixo"><ArrowDownIcon /></button>
        <button className="item-remove" onClick={onRemove} title="Remover item"><TrashIcon /></button>
      </div>
    </li>
  )
}