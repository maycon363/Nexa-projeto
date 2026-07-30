import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, getVerifiedUser } from './_supabaseAdmin.js'

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b'

function todayUTCDate() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

const SYSTEM_PROMPT = `
Você é um assistente pessoal dentro de um app chamado "Nexa", que ajuda o usuário a
acompanhar uma rotina pessoal (organizada por período do dia: manhã, tarde, noite, e
por dia da semana: 0=domingo ... 6=sábado) e valores pessoais, através de checklists
marcados dia a dia. Cada item marcado é tratado como uma "prova" de que o usuário viveu
aquele valor/hábito no dia de hoje.

O objetivo principal é ECONOMIZAR o tempo do usuário: sempre que ele pedir pra
adicionar, remover ou marcar algo, prefira fazer a ação diretamente em vez de só
explicar como ele faria manualmente.

Você recebe o estado atual (today_weekday = dia da semana de hoje, values, checklistItems
com id/kind/period/weekday/valueId/text, e completions de hoje) e a mensagem do usuário.
Responda SEMPRE em JSON puro, sem markdown, sem texto fora do JSON, no formato exato:

{
  "reply": "resposta curta e humana para o usuário, em português",
  "actions": [
    { "type": "toggle_item", "itemId": "id-do-item" },
    { "type": "create_value", "name": "Nome do valor novo", "description": "descrição curta (pode ser vazia)" },
    { "type": "add_valor_item", "valueId": "id-do-valor", "text": "texto do novo item" },
    { "type": "add_rotina_item", "period": "manha|tarde|noite", "weekday": 0, "text": "texto do novo item" },
    { "type": "edit_item", "itemId": "id-do-item", "text": "novo texto do item" },
    { "type": "remove_item", "itemId": "id-do-item" }
  ]
}

Regras:
- "actions" pode ser uma lista vazia [] se nenhuma ação for necessária.
- "toggle_item" e "remove_item" só podem usar um itemId que exista de verdade no
  checklistItems recebido no contexto — nunca invente um id.
- "edit_item" muda o texto de um item já existente (também precisa de um itemId
  real). Use isso quando o usuário pedir pra "editar", "corrigir", "renomear" ou
  "trocar o texto de" um item que já existe — NUNCA crie um item novo nesse caso.
- "add_valor_item" só pode usar um valueId que exista no contexto. Se o usuário pedir
  um valor que não existe, sugira criar em "reply" mas não invente a ação.
- Se o usuário pedir explicitamente pra CRIAR um valor novo (ex: "cria o valor Calma"
  ou "cria de imediato" quando já foi sugerido), use "create_value". Você PODE colocar
  "create_value" e vários "add_valor_item" na mesma resposta, populando o valor
  recém-criado — nesse caso, use exatamente o nome do valor (ou a mesma grafia) como
  "valueId" nos add_valor_item, o sistema resolve automaticamente pro id certo.
- IMPORTANTE: todo id (itemId, valueId) deve ser copiado EXATAMENTE igual ao que
  aparece no contexto — mesma capitalização, mesmos acentos, sem adaptar ou
  "arrumar" o texto. Um id com letra maiúscula trocada por minúscula já conta
  como inválido.
- "add_rotina_item": "period" tem que ser exatamente "manha", "tarde" ou "noite".
  "weekday" é opcional — se o usuário não especificar um dia, use o valor de
  today_weekday recebido no contexto (ou seja, assuma "hoje" por padrão). Se o
  usuário disser "amanhã", "segunda", etc., calcule o número certo (0-6) a partir
  de today_weekday.
- Itens novos devem ser concretos e realizáveis em um dia, coerentes com o contexto
  pedido (rotina ou valor).
- Quando o usuário pedir pra "trocar"/"remover e adicionar" algo, gere as duas ações
  (remove_item + add_valor_item ou add_rotina_item) na mesma resposta.
- Nunca inclua texto antes ou depois do JSON.
- O campo "reply" é SEMPRE texto natural em português, como se fosse uma mensagem de
  chat comum. NUNCA coloque JSON, chaves {}, aspas de código, ou qualquer estrutura de
  dados dentro de "reply" — mesmo que o usuário peça uma lista ou pergunte "quais
  itens", responda em frases normais (ex: "Os mais marcados foram X e Y").
`.trim()

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

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    res.status(500).json({ error: `Erro ao ler perfil: ${profileError.message}` })
    return
  }

  if (!profile) {
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    const { data: created, error: createError } = await supabaseAdmin
      .from('profiles')
      .upsert({ user_id: user.id, email: user.email, is_admin: isAdmin, daily_limit: DEFAULT_DAILY_LIMIT }, { onConflict: 'user_id' })
      .select()
      .single()

    if (createError) {
      res.status(500).json({ error: `Erro ao criar perfil: ${createError.message}` })
      return
    }
    profile = created
  }

  let remaining = null
  if (!profile.is_admin) {
    const day = todayUTCDate()
    const { data: usageRow } = await supabaseAdmin
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('day', day)
      .maybeSingle()

    const currentCount = usageRow?.count || 0

    if (currentCount >= profile.daily_limit) {
      res.status(429).json({
        error: 'daily_limit_reached',
        reply: `Você já usou suas ${profile.daily_limit} mensagens de hoje com o assistente. Volta amanhã!`,
        actions: []
      })
      return
    }

    const { error: usageError } = await supabaseAdmin
      .from('ai_usage')
      .upsert({ user_id: user.id, day, count: currentCount + 1 }, { onConflict: 'user_id,day' })

    if (usageError) {
      res.status(500).json({ error: `Erro ao registrar uso: ${usageError.message}` })
      return
    }

    remaining = profile.daily_limit - (currentCount + 1)
  }

  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'CEREBRAS_API_KEY não configurada no servidor.' })
    return
  }

  const { messages = [], context = {} } = req.body || {}

  const payload = {
    model: MODEL,
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `Contexto atual em JSON: ${JSON.stringify(context)}` },
      ...messages
    ]
  }

  try {
    const upstream = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      res.status(upstream.status).json({ error: `Erro da Cerebras: ${text}` })
      return
    }

    const data = await upstream.json()
    const raw = data.choices?.[0]?.message?.content || '{}'

    let parsed
    try {
      const cleaned = raw.trim().replace(/^```json\s*|```$/g, '')
      parsed = JSON.parse(cleaned)
    } catch {
      const match = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/)
      if (match) {
        parsed = { reply: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'), actions: [] }
      } else {
        parsed = { reply: 'A resposta ficou grande demais e não consegui interpretar tudo — tenta pedir em partes menores.', actions: [] }
      }
    }

    if (typeof parsed.reply === 'string') {
      const replyTrimmed = parsed.reply.trim()
      if (replyTrimmed.startsWith('{') && replyTrimmed.includes('"reply"')) {
        try {
          const inner = JSON.parse(replyTrimmed.replace(/^```json\s*|```$/g, ''))
          if (typeof inner.reply === 'string') {
            parsed.reply = inner.reply
            if (Array.isArray(inner.actions) && !Array.isArray(parsed.actions)) {
              parsed.actions = inner.actions
            }
          }
        } catch {
          // não conseguiu desaninhar, mantém o texto original
        }
      }
    }

    if (typeof parsed.reply !== 'string') parsed.reply = String(parsed.reply ?? '')
    if (!Array.isArray(parsed.actions)) parsed.actions = []
    parsed.remaining = remaining
    parsed.isAdmin = profile.is_admin

    res.status(200).json(parsed)
  } catch (err) {
    res.status(500).json({ error: `Falha ao chamar a Cerebras: ${err.message}` })
  }
}