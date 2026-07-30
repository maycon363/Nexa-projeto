import { supabase } from './supabaseClient.js'

export async function registerProfile({ displayName, role, linkedinUrl }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return 

  try {
    await fetch('/api/register-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ displayName, role, linkedinUrl })
    })
  } catch {
    // Falha aqui não deve travar o login — só significa que o nome não
    // ficou salvo dessa vez; não é crítico o suficiente pra bloquear o app.
  }
}