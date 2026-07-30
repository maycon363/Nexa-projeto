import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, jsonResponse } from '../lib/supabaseAdmin.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const { email, password, inviteCode, displayName, role, linkedinUrl } = event.body ? JSON.parse(event.body) : {}

  const expectedCode = process.env.SIGNUP_INVITE_CODE
  if (!expectedCode) {
    return jsonResponse(500, { error: 'Cadastro não configurado no servidor.' })
  }
  if (!inviteCode || inviteCode.trim() !== expectedCode) {
    return jsonResponse(403, { error: 'Código de convite inválido.' })
  }

  if (!email || !password) {
    return jsonResponse(400, { error: 'E-mail e senha são obrigatórios.' })
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createError) {
    return jsonResponse(400, { error: createError.message })
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
    return jsonResponse(500, { error: `Conta criada, mas houve erro ao salvar o perfil: ${profileError.message}` })
  }

  return jsonResponse(200, { ok: true })
}