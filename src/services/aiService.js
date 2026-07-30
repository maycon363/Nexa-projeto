import { supabase } from './supabaseClient.js'

export async function askAssistant({ messages, context }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token

  if (!token) {
    throw new Error('Sessão expirada — recarrega a página e entra de novo.')
  }

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ messages, context })
  })

  const body = await res.json().catch(() => ({}))

  if (res.status === 429) {
    const limitError = new Error(body.reply || 'Limite diário de mensagens atingido.')
    limitError.isLimitReached = true
    throw limitError
  }

  if (!res.ok) {
    throw new Error(body.error || `Falha ao falar com o assistente (${res.status})`)
  }

  return body // { reply, actions, remaining, isAdmin }
}