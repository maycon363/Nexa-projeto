import { useEffect, useState } from 'react'
import NexaMark from './NexaMark.jsx'
import { CloseIcon } from './Icons.jsx'

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

const DISMISS_KEY = 'nexa:iosInstallDismissed'

export default function IosInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (isIos() && !isStandalone() && !dismissed) setShow(true)
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignora */ }
  }

  if (!show) return null

  return (
    <div className="ios-install-banner">
      <span className="ios-install-mark"><NexaMark size={20} /></span>
      <div className="ios-install-text">
        <strong>Instale o Nexa no seu iPhone</strong>
        <p>
          Toque em <span className="ios-share-icon" aria-hidden="true">⬆️</span> (Compartilhar) na barra do
          Safari e depois em <strong>"Adicionar à Tela de Início"</strong>. É o único jeito do iPhone
          entregar os lembretes de rotina mesmo com o app fechado.
        </p>
      </div>
      <button className="ios-install-close" onClick={dismiss} aria-label="Fechar aviso">
        <CloseIcon />
      </button>
    </div>
  )
}