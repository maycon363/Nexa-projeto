import { useState } from 'react'
import NexaMark from './NexaMark.jsx'
import { signUpWithInvite } from '../services/signupService.js'

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
      </div>
    </div>
  )
}