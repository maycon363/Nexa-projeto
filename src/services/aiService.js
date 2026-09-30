import { supabase } from './supabaseClient.js'

// Erros 500/502/503/504 do Gemini costumam ser transitórios (a própria
// documentação do Gemini API recomenda retry com backoff exponencial pra
// erros 500 "INTERNAL" e 503 "UNAVAILABLE" — não são erro do nosso lado).
// Antes disso, a pessoa via o erro na tela e tinha que reenviar a mensagem
// na mão. Agora o próprio serviço tenta de novo sozinho, silenciosamente,
// antes de desistir e mostrar erro.
const RETRYABLE_STATUS = new Set([500, 502, 503, 504])
const MAX_RETRIES = 2
const BASE_DELAY_MS = 700

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callAiEndpoint({ messages, context }, token) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ messages, context })
  })

  const body = await res.json().catch(() => ({}))
  return { res, body }
}

export async function askAssistant({ messages, context }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token

  if (!token) {
    throw new Error('Sessão expirada, recarrega a página e entra de novo.')
  }

  let lastRes, lastBody
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res, body
    try {
      ;({ res, body } = await callAiEndpoint({ messages, context }, token))
    } catch (networkErr) {
      // Falha de rede (sem resposta nenhuma) também vale retry.
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * 2 ** attempt)
        continue
      }
      throw new Error('Não consegui falar com o assistente (conexão instável). Tenta de novo em instantes.')
    }

    lastRes = res
    lastBody = body

    if (res.status === 429) {
      const limitError = new Error(body.reply || 'Limite diário de mensagens atingido.')
      limitError.isLimitReached = true
      throw limitError
    }

    if (res.ok) return body // { reply, actions, remaining, isAdmin }

    // Erro transitório do lado do Gemini/servidor: tenta de novo sozinho,
    // com um pequeno atraso crescente, antes de expor qualquer erro.
    if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * 2 ** attempt)
      continue
    }

    break
  }

  throw new Error(
    lastBody?.error || `Falha ao falar com o assistente, tenta de novo (erro ${lastRes?.status ?? 'de conexão'})`
  )
}

// Pede pra IA classificar um hábito livre como bom/ruim/neutro, no estilo do
// cartão de hábitos do livro Hábitos Atômicos. Reaproveita o mesmo endpoint
// /api/ai (e portanto ganha o mesmo retry automático acima), só muda o
// prompt e o parsing da resposta.
export async function classifyHabitWithAI(habitText) {
  const prompt = [
    'Você está me ajudando a fazer um "cartão de hábitos" como no livro Hábitos Atômicos.',
    `Hábito: "${habitText}"`,
    'Classifique esse hábito como "bom", "ruim" ou "neutro" para alguém que quer ter uma vida mais saudável e disciplinada.',
    'Responda SOMENTE em JSON, sem markdown, no formato exato: {"classification":"bom|ruim|neutro","reason":"uma frase curta explicando por quê"}'
  ].join('\n')

  const body = await askAssistant({
    messages: [{ role: 'user', content: prompt }],
    context: { purpose: 'habit-classification' }
  })

  const raw = (body.reply || '').trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)

  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    const classification = ['bom', 'ruim', 'neutro'].includes(parsed.classification)
      ? parsed.classification
      : 'neutro'
    return { classification, reason: parsed.reason || '' }
  } catch {
    throw new Error('A IA respondeu em um formato inesperado. Tenta de novo ou classifica manualmente.')
  }
}