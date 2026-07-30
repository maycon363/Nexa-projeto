import { createClient } from '@supabase/supabase-js'

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export const DEFAULT_DAILY_LIMIT = Number(process.env.DEFAULT_DAILY_LIMIT || 20)

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function getVerifiedUser(req) {
  const authHeader = req.headers?.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { user: null, error: 'Não autenticado.' }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return { user: null, error: 'Sessão inválida ou expirada.' }
  return { user: data.user, error: null }
}