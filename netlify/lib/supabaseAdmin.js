// Fica fora de netlify/functions de propósito — assim a Netlify não tenta
// transformar esse arquivo numa rota própria, só as funções que importam ele.

import { createClient } from '@supabase/supabase-js'

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export const DEFAULT_DAILY_LIMIT = Number(process.env.DEFAULT_DAILY_LIMIT || 20)

// Client com a service_role key: ignora RLS, só existe no servidor.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Extrai e confere o usuário a partir do header "Authorization: Bearer <token>".
// Recebe o "event" da Netlify (não o req do Node/Vercel).
export async function getVerifiedUser(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { user: null, error: 'Não autenticado.' }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return { user: null, error: 'Sessão inválida ou expirada.' }
  return { user: data.user, error: null }
}

// Monta a resposta no formato que a Netlify espera (bem diferente do
// res.status().json() da Vercel).
export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}