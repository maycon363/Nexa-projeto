import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, getVerifiedUser } from './_supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const { user, error: authError } = await getVerifiedUser(req)
  if (!user) {
    res.status(401).json({ error: authError })
    return
  }

  const { displayName, role, linkedinUrl } = req.body || {}

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

    if (error) { res.status(500).json({ error: error.message }); return }
  } else {
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { user_id: user.id, email: user.email, is_admin: isAdmin, daily_limit: DEFAULT_DAILY_LIMIT, ...identifyingFields },
        { onConflict: 'user_id' }
      )

    if (error) { res.status(500).json({ error: error.message }); return }
  }

  res.status(200).json({ ok: true })
}