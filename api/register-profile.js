import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, getVerifiedUser, jsonResponse } from '../lib/supabaseAdmin.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const { user, error: authError } = await getVerifiedUser(event)
  if (!user) {
    return jsonResponse(401, { error: authError })
  }

  const { displayName, role, linkedinUrl } = event.body ? JSON.parse(event.body) : {}

  const identifyingFields = {
    display_name: (displayName || '').trim().slice(0, 120) || null,
    role: role || null,
    linkedin_url: (linkedinUrl || '').trim().slice(0, 300) || null
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(identifyingFields)
      .eq('user_id', user.id)

    if (error) return jsonResponse(500, { error: error.message })
  } else {
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { user_id: user.id, email: user.email, is_admin: isAdmin, daily_limit: DEFAULT_DAILY_LIMIT, ...identifyingFields },
        { onConflict: 'user_id' }
      )

    if (error) return jsonResponse(500, { error: error.message })
  }

  return jsonResponse(200, { ok: true })
}