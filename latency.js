// Testa a latência do Gemini com um payload do MESMO TAMANHO que o app manda
// de verdade (prompt grande + contexto grande), pra isolar se a demora é
// proporcional ao tamanho ou se tem outra coisa rolando.
//
// Como rodar:
//   node test-latency.js SUA_CHAVE_AQUI

const apiKey = process.argv[2]
if (!apiKey) {
  console.error('Uso: node test-latency.js SUA_GEMINI_API_KEY')
  process.exit(1)
}

// ~2600 tokens de prompt de sistema (tamanho real do nosso SYSTEM_PROMPT)
const fakeSystemPrompt = 'Você é um assistente de rotina pessoal. '.repeat(400)

// ~5700 tokens de contexto (tamanho real dos seus ~185 itens de checklist)
const fakeItems = Array.from({ length: 185 }, (_, i) => ({
  id: `item-${i}`,
  kind: i % 2 === 0 ? 'rotina' : 'valor',
  text: `Texto de exemplo do item número ${i} pra simular tamanho real`,
  period: 'tarde',
  weekday: i % 7
}))

const payload = {
  model: 'gemini-2.5-flash-lite',
  reasoning_effort: 'none',
  max_tokens: 12000,
  messages: [
    { role: 'system', content: fakeSystemPrompt },
    { role: 'system', content: `Contexto: ${JSON.stringify(fakeItems)}` },
    { role: 'user', content: 'marca o item-3 como feito' }
  ]
}

async function run(n) {
  const start = Date.now()
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  })
  const elapsed = ((Date.now() - start) / 1000).toFixed(2)
  const status = res.status
  console.log(`Teste ${n}: ${elapsed}s (status ${status})`)
}

async function main() {
  console.log('Tamanho do payload:', JSON.stringify(payload).length, 'chars\n')
  for (let i = 1; i <= 4; i++) {
    await run(i)
  }
}

main()