export async function signUpWithInvite({ email, password, inviteCode, displayName, role, linkedinUrl }) {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, inviteCode, displayName, role, linkedinUrl })
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(body.error || 'Não consegui criar a conta.')
  }

  return body
}