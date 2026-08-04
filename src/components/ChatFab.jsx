import { useEffect, useState } from 'react'
import AICompanion from './AICompanion.jsx'
import NexaMark from './NexaMark.jsx'

export default function ChatFab({ data, todayKey, todayWeekday, todayCompletions, userId, activeTab, onToggle, onCreateValue, onAddValorItem, onAddRotinaItem, onEditItem, onRemoveItem }) {
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
        <svg className="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17.5H5A2.5 2.5 0 0 1 2.5 15V7A2.5 2.5 0 0 1 5 4.5Z"
            style={{ stroke: 'var(--color-bg)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="11" r="1.1" style={{ fill: 'var(--color-bg)' }} />
          <circle cx="12" cy="11" r="1.1" style={{ fill: 'var(--color-bg)' }} />
          <circle cx="15.5" cy="11" r="1.1" style={{ fill: 'var(--color-bg)' }} />
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
            activeTab={activeTab}
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