import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT } from './_supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const { email, password, inviteCode, displayName, role, linkedinUrl } = req.body || {}

  const expectedCode = process.env.SIGNUP_INVITE_CODE
  if (!expectedCode) {
    res.status(500).json({ error: 'Cadastro não configurado no servidor.' })
    return
  }
  if (!inviteCode || inviteCode.trim() !== expectedCode) {
    res.status(403).json({ error: 'Código de convite inválido.' })
    return
  }

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
    return
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createError) {
    res.status(400).json({ error: createError.message })
    return
  }

  const user = created.user
  const isAdmin = ADMIN_EMAILS.includes((email || '').toLowerCase())

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        email,
        is_admin: isAdmin,
        daily_limit: DEFAULT_DAILY_LIMIT,
        display_name: (displayName || '').trim().slice(0, 120) || null,
        role: role || null,
        linkedin_url: (linkedinUrl || '').trim().slice(0, 300) || null
      },
      { onConflict: 'user_id' }
    )

  if (profileError) {
    res.status(500).json({ error: `Conta criada, mas houve erro ao salvar o perfil: ${profileError.message}` })
    return
  }

  res.status(200).json({ ok: true })
}