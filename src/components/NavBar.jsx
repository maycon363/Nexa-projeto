import { useState } from 'react'
import NexaMark from './NexaMark.jsx'

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'historico', label: 'Histórico' },
  { id: 'valores', label: 'Valores' },
  { id: 'aprenda', label: 'Aprenda' },
  { id: 'aprendizado', label: 'Aprendizado' },
  { id: 'sobre', label: 'Sobre' }
]

export default function NavBar({ active, onChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeLabel = TABS.find(t => t.id === active)?.label || ''

  function selectTab(id) {
    onChange(id)
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">
        <NexaMark size={22} className="navbar-brand-mark" />
        <span className="navbar-brand-text">exa</span>
      </span>

      <div className="navbar-tabs navbar-tabs-desktop">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`navbar-tab${active === tab.id ? ' active' : ''}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button className="navbar-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Abrir menu de abas">
        <span>{activeLabel}</span>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {menuOpen && (
        <div className="navbar-mobile-overlay" onClick={() => setMenuOpen(false)}>
          <div className="navbar-mobile-menu" onClick={e => e.stopPropagation()}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`navbar-mobile-item${active === tab.id ? ' active' : ''}`}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}