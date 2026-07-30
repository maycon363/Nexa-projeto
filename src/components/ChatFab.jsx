import { useEffect, useState } from 'react'
import AICompanion from './AICompanion.jsx'
import NexaMark from './NexaMark.jsx'

export default function ChatFab({ data, todayKey, todayWeekday, todayCompletions, userId, onToggle, onCreateValue, onAddValorItem, onAddRotinaItem, onEditItem, onRemoveItem }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handlePrefill() {
      setOpen(true)
    }
    window.addEventListener('nexa:prefillChat', handlePrefill)
    return () => window.removeEventListener('nexa:prefillChat', handlePrefill)
  }, [])

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Abrir assistente">
        <span className="fab-shine" />
        <svg className="fab-bot" width="32" height="32" viewBox="0 0 40 40" fill="none">
          {/* antena */}
          <line x1="20" y1="4" x2="20" y2="9" style={{ stroke: 'var(--color-bg)' }} strokeWidth="1.6" />
          <circle className="fab-bot-antenna-tip" cx="20" cy="3.5" r="1.8" style={{ fill: 'var(--color-bg)' }} />

          {/* cabeça / visor metálico */}
          <rect x="7" y="9" width="26" height="21" rx="9" style={{ fill: 'var(--color-bg)' }} opacity="0.95" />
          <rect x="7" y="9" width="26" height="21" rx="9" style={{ stroke: 'var(--color-green-bright)' }} strokeWidth="1.2" opacity="0.6" />

          {/* linhas de painel, lateral */}
          <line x1="9.5" y1="14" x2="9.5" y2="25" style={{ stroke: 'var(--color-green-bright)' }} strokeWidth="1" opacity="0.4" />
          <line x1="30.5" y1="14" x2="30.5" y2="25" style={{ stroke: 'var(--color-green-bright)' }} strokeWidth="1" opacity="0.4" />

          {/* trilho do visor escaneador */}
          <rect x="11" y="17.5" width="18" height="5" rx="2.5" style={{ fill: 'rgba(0,0,0,0.4)' }} />
          <circle className="fab-scan-dot" cx="13" cy="20" r="2.4" style={{ fill: 'var(--color-green-bright)' }} />
        </svg>
      </button>

      <div
        className={`chat-drawer-overlay${open ? '' : ' chat-drawer-hidden'}`}
        onClick={() => setOpen(false)}
      >
        <div className="chat-drawer" onClick={e => e.stopPropagation()}>
          <div className="chat-drawer-head">
            <span className="chat-drawer-title">
              <NexaMark size={18} className="chat-drawer-mark" />
              Assistente
            </span>
            <button className="chat-drawer-close" onClick={() => setOpen(false)} aria-label="Fechar">✕</button>
          </div>
          <AICompanion
            data={data}
            todayKey={todayKey}
            todayWeekday={todayWeekday}
            todayCompletions={todayCompletions}
            userId={userId}
            onToggle={onToggle}
            onCreateValue={onCreateValue}
            onAddValorItem={onAddValorItem}
            onAddRotinaItem={onAddRotinaItem}
            onEditItem={onEditItem}
            onRemoveItem={onRemoveItem}
          />
        </div>
      </div>
    </>
  )
}