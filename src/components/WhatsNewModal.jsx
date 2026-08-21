import { useEffect, useState } from 'react'
import { CHANGELOG, latestChangelogId } from '../data/changelog.js'
import NexaMark from './NexaMark.jsx'

function seenKey(userId) {
  return `nexa:whatsNewSeen:${userId}`
}

function getSeenId(userId) {
  try {
    const raw = localStorage.getItem(seenKey(userId))
    return raw ? Number(raw) : 0
  } catch {
    return 0
  }
}

function setSeenId(userId, id) {
  try {
    localStorage.setItem(seenKey(userId), String(id))
  } catch {
    // localStorage bloqueado/cheio: só não persiste, sem quebrar o app
  }
}

// open: quando true (via botão do rodapé, por ex.) força a abertura mesmo
// que a pessoa já tenha visto tudo. onOpenChange avisa o pai quando fecha.
export default function WhatsNewModal({ userId, forceOpenSignal, onOpenChange }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = getSeenId(userId)
    if (seen < latestChangelogId()) setVisible(true)
  }, [userId])

  useEffect(() => {
    if (forceOpenSignal) setVisible(true)
  }, [forceOpenSignal])

  function close() {
    setSeenId(userId, latestChangelogId())
    setVisible(false)
    onOpenChange?.(false)
  }

  if (!visible) return null

  return (
    <div className="whatsnew-overlay" onClick={close}>
      <div className="whatsnew-modal" onClick={e => e.stopPropagation()}>
        <div className="whatsnew-head">
          <span className="whatsnew-title">
            <NexaMark size={18} className="chat-drawer-mark" />
            Novidades
          </span>
          <button className="chat-drawer-close" onClick={close} aria-label="Fechar">✕</button>
        </div>

        <div className="whatsnew-body">
          {CHANGELOG.map(entry => (
            <div className="whatsnew-entry" key={entry.id}>
              <div className="whatsnew-entry-head">
                <h3 className="whatsnew-entry-title">{entry.title}</h3>
                <span className="whatsnew-entry-date">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <ul className="whatsnew-entry-list">
                {entry.items.map((it, idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <button className="whatsnew-confirm" onClick={close}>Entendi</button>
      </div>
    </div>
  )
}