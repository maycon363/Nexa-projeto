import { jsonResponse } from '../lib/supabaseAdmin.js'

export async function handler() {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return jsonResponse(500, { error: 'VAPID_PUBLIC_KEY não configurada no servidor.' })
  return jsonResponse(200, { publicKey: key })
}