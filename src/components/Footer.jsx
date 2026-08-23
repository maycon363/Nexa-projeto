import { useEffect, useState } from 'react'
import { ExportIcon, ImportIcon, LogoutIcon, BellIcon, GithubIcon, LinkedinIcon, InstagramIcon } from './Icons.jsx'
import { enablePushNotifications, disablePushNotifications, getPushSubscriptionStatus, pushSupported } from '../services/pushService.js'

// Troque os links abaixo pelos seus de verdade.
const SOCIAL_LINKS = [
  { href: 'https://github.com/maycon363', label: 'GitHub', Icon: GithubIcon },
  { href: 'https://www.linkedin.com/in/maycon-borges-4a6022338/', label: 'LinkedIn', Icon: LinkedinIcon },
  { href: 'https://www.instagram.com/mayconborges.p?igsh=MXBwenlkNWNxcGJ4cA%3D%3D', label: 'Instagram', Icon: InstagramIcon }
]

export default function Footer({ onExport, onImport, onSignOut }) {
  const [pushStatus, setPushStatus] = useState('checking') // checking | unsupported | not-subscribed | subscribed
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pushSupported()) { setPushStatus('unsupported'); return }
    getPushSubscriptionStatus().then(setPushStatus).catch(() => setPushStatus('not-subscribed'))
  }, [])

  async function togglePush() {
    setBusy(true)
    try {
      if (pushStatus === 'subscribed') {
        await disablePushNotifications()
        setPushStatus('not-subscribed')
      } else {
        await enablePushNotifications()
        setPushStatus('subscribed')
      }
    } catch (err) {
      alert(err.message || 'Não consegui ativar as notificações.')
    } finally {
      setBusy(false)
    }
  }

  const pushLabel =
    pushStatus === 'subscribed' ? 'Lembretes ativados' :
    pushStatus === 'unsupported' ? 'Lembretes indisponíveis' :
    'Ativar lembretes'

  return (
    <footer className="app-footer">
      <div className="app-footer-actions">
        <button onClick={onExport}><ExportIcon /> Exportar JSON</button>
        <label>
          <ImportIcon /> Importar JSON
          <input type="file" accept="application/json" onChange={onImport} />
        </label>
        <button
          onClick={togglePush}
          disabled={busy || pushStatus === 'unsupported' || pushStatus === 'checking'}
          className={pushStatus === 'subscribed' ? 'app-footer-push-on' : ''}
        >
          <BellIcon /> {busy ? '…' : pushLabel}
        </button>
        <button className="app-footer-signout" onClick={onSignOut}><LogoutIcon /> Sair</button>
      </div>

      <p className="app-footer-note">Nexa foi feito pra economizar seu tempo, não pra virar mais uma tarefa.</p>

      <div className="app-footer-bottom">
        <span>© {new Date().getFullYear()} Maycon. Todos os direitos reservados.</span>
        <div className="app-footer-social">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}