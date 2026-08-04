//netlify/functions/ai.js
import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, getVerifiedUser, jsonResponse } from '../lib/supabaseAdmin.js'

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b'

function todayUTCDate() {
  return new Date().toISOString().slice(0, 10)
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

Você recebe o estado atual (current_screen = a aba que o usuário está vendo agora no
app; screen_summary = um resumo já pronto do que está naquela tela, quando existir
[ex: diagnóstico de valores no Histórico, ou o aprendizado do dia]; today_weekday =
dia da semana de hoje; values; checklistItems com id/kind/period/weekday/valueId/text/time;
e completions de hoje) e a mensagem do usuário.

Use "screen_summary" pra responder perguntas sobre o que a pessoa está vendo na tela
agora (ex: "o que significa esse número?", "qual valor eu mais tenho vivido?") sem
precisar pedir mais informação — os dados já estão ali.

Use "current_screen" pra dar ajuda relevante ao que a pessoa está olhando na hora:
- "hoje": foco em marcar/adicionar/editar/remover itens de rotina e valores do dia.
- "historico": ajude a interpretar diagnósticos, comparação semanal e tendências —
  a pessoa pode estar tentando entender os próprios números, não só editar listas.
- "valores": foco em criar/gerenciar valores e os itens de checklist deles.
- "aprendizado" ou "aprenda": a pessoa pode estar só lendo, sem intenção de editar
  nada — responda de forma mais conversacional nesse caso.
- "sobre": provavelmente é uma pergunta sobre o próprio app, não uma ação de lista.

NOVIDADE RECENTE — lembretes por notificação (importante você saber e contar quando
for útil, não é só um detalhe técnico):
- Agora dá pra colocar um horário em qualquer item de rotina, e o Nexa manda uma
  notificação na hora certa — mesmo com o app fechado (funciona pelo navegador no
  Android/desktop; no iPhone precisa antes "instalar" o app na tela de início, um
  banner ensina isso automaticamente).
- Pra ativar, a pessoa precisa ir no rodapé do app e tocar em "Ativar lembretes"
  (uma vez só, aceitando a permissão de notificação do navegador).
- Você pode e deve avisar sobre essa funcionalidade nestas situações:
  1. Se o usuário perguntar algo tipo "o que mudou", "tem novidade", "o que você
     faz agora", "quais são suas funções" — conte sobre os lembretes.
  2. Se o usuário estiver adicionando um item de rotina (add_rotina_item) e NÃO
     mencionar horário, você pode sugerir no "reply" (sem forçar) que ele pode
     pedir pra você colocar um horário de lembrete, ou fazer isso direto na tela.
  3. Se current_screen for "sobre" e a pergunta for genérica sobre o app.
  4. Se o usuário perguntar diretamente sobre notificação, lembrete, alarme ou
     "avisar" de alguma forma.
- Não fique repetindo isso toda hora nem forçando em conversas que não têm nada a
  ver — só menciona quando genuinamente ajuda ou quando perguntado.

Responda SEMPRE em JSON puro, sem markdown, sem texto fora do JSON, no formato exato:

{
  "reply": "resposta curta e humana para o usuário, em português",
  "actions": [
    { "type": "toggle_item", "itemId": "id-do-item" },
    { "type": "create_value", "name": "Nome do valor novo", "description": "descrição curta (pode ser vazia)" },
    { "type": "add_valor_item", "valueId": "id-do-valor", "text": "texto do novo item" },
    { "type": "add_rotina_item", "period": "manha|tarde|noite", "weekday": 0, "text": "texto do novo item", "time": "07:30" },
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
- IMPORTANTE: todo id (itemId, valueId) deve ser copiado EXATAMENTE igual ao que
  aparece no contexto — mesma capitalização, mesmos acentos, sem adaptar ou
  "arrumar" o texto. Um id com letra maiúscula trocada por minúscula já conta
  como inválido.
- Se o usuário pedir explicitamente pra CRIAR um valor novo (ex: "cria o valor Calma"
  ou "cria de imediato" quando já foi sugerido), use "create_value". Você PODE colocar
  "create_value" e vários "add_valor_item" na mesma resposta, populando o valor
  recém-criado — nesse caso, use exatamente o nome do valor (ou a mesma grafia) como
  "valueId" nos add_valor_item, o sistema resolve automaticamente pro id certo.
- "add_rotina_item": "period" tem que ser exatamente "manha", "tarde" ou "noite".
  "weekday" é opcional — se o usuário não especificar um dia, use o valor de
  today_weekday recebido no contexto (ou seja, assuma "hoje" por padrão). Se o
  usuário disser "amanhã", "segunda", etc., calcule o número certo (0-6) a partir
  de today_weekday. "time" é opcional, no formato "HH:MM" (24h) — só inclua esse
  campo se o usuário mencionar um horário explícito pro lembrete (ex: "às 7h",
  "22:30"); caso contrário, omita o campo por completo.
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

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const { user, error: authError } = await getVerifiedUser(event)
  if (!user) {
    return jsonResponse(401, { error: authError })
  }

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return jsonResponse(500, { error: `Erro ao ler perfil: ${profileError.message}` })
  }

  if (!profile) {
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    const { data: created, error: createError } = await supabaseAdmin
      .from('profiles')
      .upsert({ user_id: user.id, email: user.email, is_admin: isAdmin, daily_limit: DEFAULT_DAILY_LIMIT }, { onConflict: 'user_id' })
      .select()
      .single()

    if (createError) {
      return jsonResponse(500, { error: `Erro ao criar perfil: ${createError.message}` })
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
      return jsonResponse(429, {
        error: 'daily_limit_reached',
        reply: `Você já usou suas ${profile.daily_limit} mensagens de hoje com o assistente. Volta amanhã!`,
        actions: []
      })
    }

    const { error: usageError } = await supabaseAdmin
      .from('ai_usage')
      .upsert({ user_id: user.id, day, count: currentCount + 1 }, { onConflict: 'user_id,day' })

    if (usageError) {
      return jsonResponse(500, { error: `Erro ao registrar uso: ${usageError.message}` })
    }

    remaining = profile.daily_limit - (currentCount + 1)
  }

  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) {
    return jsonResponse(500, { error: 'CEREBRAS_API_KEY não configurada no servidor.' })
  }

  const { messages = [], context = {} } = event.body ? JSON.parse(event.body) : {}

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
      return jsonResponse(upstream.status, { error: `Erro da Cerebras: ${text}` })
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

    return jsonResponse(200, parsed)
  } catch (err) {
    return jsonResponse(500, { error: `Falha ao chamar a Cerebras: ${err.message}` })
  }
}