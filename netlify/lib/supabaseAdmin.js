// Fica fora de netlify/functions de propósito — assim a Netlify não tenta
// transformar esse arquivo numa rota própria, só as funções que importam ele.

import { Agent, setGlobalDispatcher } from 'undici'
import { createClient } from '@supabase/supabase-js'

setGlobalDispatcher(new Agent({ connect: { autoSelectFamily: true } }))

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export const DEFAULT_DAILY_LIMIT = Number(process.env.DEFAULT_DAILY_LIMIT || 20)

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function getVerifiedUser(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { user: null, error: 'Não autenticado.' }

  if (typeof supabaseAdmin.auth.getClaims === 'function') {
    try {
      const { data, error } = await supabaseAdmin.auth.getClaims(token)
      if (!error && data?.claims?.sub) {
        return { user: { id: data.claims.sub, email: data.claims.email || null }, error: null }
      }
    } catch {
    }
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return { user: null, error: 'Sessão inválida ou expirada.' }
  return { user: data.user, error: null }
}

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}