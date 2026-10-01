import { useState } from 'react'
import NexaMark from './NexaMark.jsx'
import { signUpWithInvite } from '../services/signupService.js'
import { MailIcon } from './Icons.jsx'

// TODO: troque pelo seu e-mail de verdade antes de publicar.
const ACCESS_REQUEST_EMAIL = 'mayconborges2025@gmail.com'

const ACCESS_REQUEST_SUBJECT = 'Solicitação de acesso ao Nexa'
const ACCESS_REQUEST_BODY = [
  'Olá!',
  '',
  'Gostaria de solicitar um código de convite para acessar o Nexa.',
  '',
  'Meu nome: ',
  'Eu sou (amigo / recrutador / outro): ',
  'Link do LinkedIn (se for recrutador): '
].join('\n')

// mailto: sozinho falha silenciosamente em muito PC — quem usa Gmail/Outlook
// pelo navegador não tem programa de e-mail padrão configurado, então o
// clique não faz nada visível. Por isso oferecemos 3 caminhos: app de
// e-mail (ótimo no celular), Gmail/Outlook direto no navegador (ótimo no
// PC), e copiar o endereço como último recurso — sempre funciona em algum.
function buildMailtoLink() {
  return `mailto:${ACCESS_REQUEST_EMAIL}?subject=${encodeURIComponent(ACCESS_REQUEST_SUBJECT)}&body=${encodeURIComponent(ACCESS_REQUEST_BODY)}`
}

function buildGmailWebLink() {
  const params = new URLSearchParams({
    view: 'cm', fs: '1', to: ACCESS_REQUEST_EMAIL, su: ACCESS_REQUEST_SUBJECT, body: ACCESS_REQUEST_BODY
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

function buildOutlookWebLink() {
  const params = new URLSearchParams({
    to: ACCESS_REQUEST_EMAIL, subject: ACCESS_REQUEST_SUBJECT, body: ACCESS_REQUEST_BODY
  })
  return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`
}

function AccessRequestModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(ACCESS_REQUEST_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard bloqueado (raro) — a pessoa ainda vê o e-mail escrito na tela
    }
  }

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="whatsnew-head">
          <span className="whatsnew-title">Solicitar acesso</span>
          <button className="chat-drawer-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <p className="settings-intro">
          Escolha o jeito que funcionar melhor pra você — no celular, "Abrir no app de
          E-mail" já resolve; no computador, geralmente é mais fácil pelo Gmail/Outlook.
        </p>

        <div className="access-request-options">
          <a className="access-request-option" href={buildMailtoLink()}>
            Abrir no app de E-mail
          </a>
          <a className="access-request-option" href={buildGmailWebLink()} target="_blank" rel="noopener noreferrer">
            Abrir no Gmail (navegador)
          </a>
          <a className="access-request-option" href={buildOutlookWebLink()} target="_blank" rel="noopener noreferrer">
            Abrir no Outlook (navegador)
          </a>
          <button type="button" className="access-request-option" onClick={copyEmail}>
            {copied ? 'E-mail copiado!' : `Copiar e-mail (${ACCESS_REQUEST_EMAIL})`}
          </button>
        </div>

        <button className="whatsnew-confirm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}

export default function AuthScreen({ onSignIn }) {
  const [mode, setMode] = useState('signin') 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('amigo')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessRequestOpen, setAccessRequestOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await onSignIn(email, password)
      } else {
        if (!displayName.trim()) {
          throw new Error('Como podemos te chamar?')
        }
        if (role === 'recrutador' && !linkedinUrl.trim()) {
          throw new Error('Cola o link do seu LinkedIn, assim consigo te reconhecer.')
        }
        if (!inviteCode.trim()) {
          throw new Error('Esse app é fechado — pede o código de convite pra quem te passou o link.')
        }

        await signUpWithInvite({ email, password, inviteCode, displayName, role, linkedinUrl })
        // Conta criada com sucesso (já sem precisar confirmar e-mail) — loga direto.
        await onSignIn(email, password)
      }
    } catch (err) {
      setError(err.message || 'Algo deu errado. Tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <NexaMark size={26} />
          <span>exa</span>
        </div>
        <p className="auth-subtitle">{mode === 'signin' ? 'Entrar na sua rotina' : 'Criar sua conta'}</p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                placeholder="Seu nome"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="amigo">Sou amigo(a) / pessoa próxima</option>
                <option value="recrutador">Sou recrutador(a)</option>
                <option value="outro">Outro</option>
              </select>
              {role === 'recrutador' && (
                <input
                  type="url"
                  placeholder="Link do seu LinkedIn"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  required
                />
              )}
            </>
          )}

          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="senha (mínimo 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Código de convite"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              required
            />
          )}

          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => { setMode(m => (m === 'signin' ? 'signup' : 'signin')); setError('') }}
        >
          {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>

        <button
          type="button"
          className="auth-request-access"
          onClick={() => setAccessRequestOpen(true)}
        >
          <MailIcon size={14} />
          Não tem código de convite? Solicitar acesso por e-mail
        </button>
      </div>

      {accessRequestOpen && <AccessRequestModal onClose={() => setAccessRequestOpen(false)} />}
    </div>
  )
}