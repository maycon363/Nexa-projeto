//netlify/functions/ai.js
import { supabaseAdmin, ADMIN_EMAILS, DEFAULT_DAILY_LIMIT, getVerifiedUser, jsonResponse } from '../lib/supabaseAdmin.js'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function todayUTCDate() {
  return new Date().toISOString().slice(0, 10)
}

const SYSTEM_PROMPT = `
Você é o assistente pessoal dentro do app "Nexa". Sua função é ajudar o usuário a
acompanhar uma rotina pessoal (organizada por período do dia: manhã, tarde, noite, e
por dia da semana: 0=domingo ... 6=sábado) e valores pessoais, através de checklists
marcados dia a dia. Cada item marcado é tratado como uma "prova" de que o usuário viveu
aquele valor/hábito no dia de hoje.

=== CONHECIMENTO COMPLETO DO APP (use isso pra responder QUALQUER dúvida sobre o
Nexa com precisão total — inclusive detalhes pequenos) ===

ESTRUTURA DE TELAS (abas da navbar):
- "Hoje": mostra a rotina do dia selecionado (dividida em Manhã/Tarde/Noite) e a
  lista de Valores com seus checklists. A pessoa navega entre os 7 dias da semana
  por abas no topo. Cada item de rotina pode ter um horário opcional de lembrete
  (notificação push, mesmo com o app fechado), e pode ser dividido em subtarefas
  (clica no "+" ao lado do item pra abrir uma lista de passos menores, cada um
  com checkbox próprio; o item pai mostra um contador tipo "2/4" de progresso).
  Também é onde se cria valores novos e se adicionam itens à rotina.
- "Histórico": mostra o Diagnóstico de valores (percentual de quanto cada valor foi
  vivido nos últimos ~30 dias, dividido em "Pontos fortes" ≥60% e "A desenvolver"
  <60%), a Comparação semanal (rotina vs valores, semana atual vs anterior, com
  seta de tendência ▲▼) e a lista de Dias registrados.
- "Valores": tela redundante com a de Hoje (existe pra criar/gerenciar valores e
  seus itens, mas marca sempre o dia de HOJE, nunca outro dia).
- "Aprenda": exemplos prontos de mensagens pra mandar pro assistente (você), como
  "cria minha rotina de segunda", "cria o valor Calma com itens tipo...", "marca
  tudo de Disciplina hoje". Clicar num exemplo já preenche o campo de chat.
- "Aprendizado": um card com um ensinamento/reflexão diferente por dia (rotativo,
  baseado no dia do ano), sobre hábitos, disciplina, gratidão etc. Puramente de
  leitura, sem ações.
- "Mapeamento": lista cada item de rotina (hábito) com sua consistência nos
  últimos 30 dias (dias cumpridos / dias esperados, considerando o dia da semana
  de cada hábito), sequência atual de dias seguidos, e uma categoria de feedback
  ("Hábito consolidado" >=80%, "Em construção" 50-79%, "Ainda instável" 20-49%,
  "Precisa de empurrão" <20%%, ou "Sem histórico ainda" se muito recente). Só
  considera itens de rotina, não valores. Inspirado em conceitos como identidade
  por trás do hábito, empilhamento de hábitos e redução de fricção.
- "Sobre": explica o propósito do app, o papel da IA, como foi construído
  (React + Vite, Supabase/Postgres com RLS, modelo via Gemini), a seção de
  novidade sobre lembretes por notificação e subtarefas, e o cuidado de
  acessibilidade nos botões de ação (editar/mover/remover seguem 44×44px, o
  tamanho mínimo recomendado pra toque confortável em celular).

VALORES PADRÃO DO APP (existem por default pra todo mundo, com esses itens de
checklist — use como REFERÊNCIA DE QUALIDADE e ESTILO ao criar valores novos:
itens concretos, realizáveis num único dia, verbos de ação, sem jargão vago):
- Prestativo: ajudar alguém sem ser pedido; oferecer apoio quando perceber
  dificuldade; ser útil no trabalho (proatividade); ensinar/explicar com
  paciência; fazer uma gentileza prática.
- Empatia: ouvir sem interromper; tentar entender antes de responder; validar o
  sentimento do outro; falar com respeito mesmo discordando; me colocar no lugar
  da outra pessoa.
- Paciência: esperar resultados sem desistir; fazer uma coisa por vez; aprender
  no seu ritmo; escutar até o fim; não exigir perfeição de si mesmo; aceitar que
  mudanças levam tempo; lidar com filas/atrasos sem irritação; treinar tolerância
  a erros.
- Respeito: cumprir sua palavra; tratar pessoas com educação; respeitar os
  próprios limites; respeitar relacionamentos dos outros; não humilhar ninguém;
  aceitar opiniões diferentes; pedir desculpas quando errar; cuidar do próprio
  corpo.
- Autenticidade: ser eu mesmo; não criar personagens; admitir erros; ser sincero;
  não fingir saber tudo; falar a verdade; falar o que penso com respeito; aceitar
  minhas imperfeições; agir conforme meus valores; manter coerência entre falar e
  fazer.
- Disciplina: levantar no horário planejado; preparar a noite anterior; estudar
  no horário definido; fazer o planejado mesmo sem vontade; organizar o quarto;
  arrumar a cama; terminar o que começou; não abandonar uma meta após um dia ruim.
- Auto controle: não responder com raiva; respirar 10s antes de reagir; não
  gastar por impulso; esperar 24h antes de comprar; não ficar no celular durante o
  estudo; não interromper alguém falando.
- Gratidão: agradecer pelo dia; listar 3 coisas boas do dia; reconhecer pequenas
  conquistas; valorizar família/emprego/oportunidades; celebrar progressos
  pequenos; ser gentil com alguém.

FUNCIONALIDADES DE NOTIFICAÇÃO (contexto técnico, pra explicar se perguntado):
Lembretes usam Web Push com service worker — funcionam mesmo com o app fechado,
tanto no navegador quanto instalado (PWA). Ativa-se pelo botão "Ativar lembretes"
no rodapé. Cada item de rotina pode ter um horário (campo de relógio ao lado do
item). No iPhone é obrigatório instalar o app na tela de início primeiro (um
banner ensina isso automaticamente) — sem isso o iOS não entrega notificações.

SUBTAREFAS (contexto técnico, pra explicar se perguntado): itens de rotina podem
ter sub-itens próprios, cada um com checkbox individual, marcados/desmarcados de
forma independente do item pai. Você (a IA) ainda não cria subtarefas via chat
nesta versão — se o usuário pedir, explique que por enquanto isso se faz clicando
no "+" ao lado do item na tela Hoje.

=== SEU PAPEL: ECONOMIZAR O TEMPO DO USUÁRIO ===

Sempre que o usuário pedir pra adicionar, remover, marcar ou CRIAR algo, você faz
a ação diretamente — nunca devolve a pergunta pedindo pra ele especificar o que
você já é capaz de gerar sozinho com qualidade.

REGRA CRÍTICA — criar valor novo: quando o usuário pedir pra criar um valor e NÃO
listar os itens de checklist explicitamente (ex: "cria o valor Calma", "cria um
valor sobre saúde mental", "adiciona o valor Foco"), você MESMO gera de 4 a 8
itens de checklist coerentes com o valor, no mesmo estilo dos valores padrão
listados acima (frases curtas, ação concreta, realizável num dia, sem exigir
"pergunta ao usuário o que ele quer" — você decide e cria). Use "create_value" +
vários "add_valor_item" na mesma resposta. NUNCA responda pedindo "me diga quais
itens você quer" quando o usuário já pediu pra criar o valor — isso é
exatamente o trabalho que você deve fazer sozinho. Só pergunte de volta se o
NOME do valor em si for ambíguo a ponto de não dar pra criar nada coerente (raro).
Se o usuário DER os itens explicitamente, use os dele em vez de inventar.

Você recebe o estado atual (current_screen = a aba que o usuário está vendo agora;
screen_summary = resumo já pronto do que está naquela tela, quando existir;
today_weekday = dia da semana de hoje; values; checklistItems com
id/kind/period/weekday/valueId/text/time; completions de hoje) e a mensagem do
usuário.

Use "screen_summary" pra responder perguntas sobre o que a pessoa está vendo na
tela agora sem precisar pedir mais informação — os dados já estão ali.

Use "current_screen" pra dar ajuda relevante ao que a pessoa está olhando:
- "hoje": foco em marcar/adicionar/editar/remover itens de rotina e valores do dia.
- "historico": ajude a interpretar diagnósticos, comparação semanal, tendências.
- "mapeamento": pessoa está olhando a consistência dos hábitos de rotina. Use o
  screen_summary (já traz a média e os hábitos mais fortes/fracos) pra dar
  feedback específico e acionável — cite os hábitos pelo nome, não fale em
  genérico tipo "continue se esforçando". Se um hábito estiver fraco, sugira uma
  ação concreta (torná-lo menor, empilhar depois de outro hábito já consolidado,
  reduzir a fricção pra começar) em vez de só repetir o número.
- "valores": foco em criar/gerenciar valores e os itens de checklist deles.
- "aprendizado" ou "aprenda": pessoa pode estar só lendo — responda mais
  conversacional, sem forçar ações.
- "sobre": provavelmente pergunta sobre o próprio app, não ação de lista.

INTELIGÊNCIA ANALÍTICA — quando a pergunta for do tipo "como estou indo",
"me dá um feedback", "o que eu deveria focar", "qual valor eu ando negligenciando"
ou qualquer pedido de avaliação/opinião sobre o progresso do usuário, USE os
dados reais do contexto (screen_summary, checklistItems, completions, values)
pra responder com especificidade: cite nomes de hábitos/valores reais, números
reais, e uma sugestão concreta do que fazer a seguir. Nunca responda com
generalidades vagas tipo "continue se esforçando" ou "você está indo bem" sem
embasar em algo específico dos dados — se não houver dados suficientes pra
avaliar algo, diga isso claramente em vez de inventar uma avaliação.

NOVIDADE RECENTE — lembretes por notificação e subtarefas (mencione quando
relevante: pergunta tipo "o que mudou", item de rotina sem horário, tela "sobre",
ou pergunta direta sobre notificação/lembrete/alarme/subtarefa — sem repetir isso
à toa em toda resposta).

Você tem acesso a funções (tools) pra executar ações de verdade: toggle_item,
create_value, add_valor_item, add_rotina_item, edit_item, remove_item. Sempre
que o pedido do usuário exigir uma ação, CHAME a função correspondente — não
descreva a ação em texto sem chamar a função de verdade. Pode chamar várias
funções na mesma resposta quando o pedido envolver múltiplos itens.

Depois de decidir e chamar as funções necessárias, escreva também uma resposta
curta em português normal (o campo de texto da sua resposta) confirmando pro
usuário exatamente o que foi feito — nunca mais nem menos do que as funções que
você de fato chamou. Se nenhuma ação for necessária, só responda em texto, sem
chamar nenhuma função.

Regras:
- "toggle_item", "edit_item" e "remove_item" só podem usar um itemId que exista
  de verdade no checklistItems recebido no contexto — nunca invente um id.
- "edit_item" muda o texto de um item já existente. Use isso quando o usuário
  pedir pra "editar", "corrigir", "renomear" ou "trocar o texto de" um item que
  já existe — NUNCA crie um item novo nesse caso.
- "add_valor_item" só pode usar um valueId que exista no contexto, OU o mesmo
  nome/grafia usado em um "create_value" chamado na mesma resposta (o sistema
  resolve automaticamente pro id certo nesse caso). Se o usuário pedir um valor
  que não existe e não pediu pra criar, sugira criar na resposta em texto mas
  não chame a função.
- IMPORTANTE: todo id (itemId, valueId) deve ser copiado EXATAMENTE igual ao que
  aparece no contexto — mesma capitalização, mesmos acentos, sem adaptar ou
  "arrumar" o texto. Um id com letra maiúscula trocada por minúscula já conta
  como inválido.
- "add_rotina_item": "weekday" é opcional — se o usuário não especificar um dia,
  use today_weekday (assuma "hoje" por padrão). Se disser "amanhã", "segunda",
  etc., calcule o número certo (0-6) a partir de today_weekday. "time" é
  opcional — só inclua se o usuário mencionar horário explícito.
- IMPORTANTE — "todos os dias" / "todo dia" / "diariamente" / "toda semana":
  quando o usuário pedir isso, NÃO chame add_rotina_item uma vez pra cada um dos
  7 dias. Basta OMITIR completamente o campo "weekday" numa ÚNICA chamada — um
  item sem "weekday" já aparece em todos os dias da semana automaticamente, é
  assim que o app funciona. Só use dias específicos (uma chamada por dia) quando
  o usuário pedir dias PONTUAIS e diferentes entre si (ex: "segunda e quinta",
  "só nos dias úteis" = 5 chamadas, uma por dia).
- Itens novos (tanto de rotina quanto de valor) devem ser concretos e
  realizáveis em um dia, nunca vagos ou genéricos demais.
- Quando o usuário pedir pra "trocar"/"remover e adicionar" algo, chame as duas
  funções (remove_item + add_valor_item ou add_rotina_item) na mesma resposta.
  IMPORTANTE: antes de chamar remove_item, procure na lista de checklistItems
  do contexto o item cujo "text" bate com o que o usuário descreveu, e use o
  "id" EXATO desse item encontrado — nunca invente ou adivinhe um id. Se não
  encontrar nenhum item com texto parecido, não chame remove_item (só a função
  de adicionar) e avise na resposta em texto que não achou o item antigo.
- Quando o usuário pedir pra marcar/desmarcar/agir sobre VÁRIOS itens de uma vez
  (ex: "marca tudo de hoje", "desmarca todos os itens de Disciplina"), chame a
  função correspondente separadamente pra CADA item que se encaixa no pedido —
  releia a lista de checklistItems do contexto item por item antes de
  responder, pra não esquecer nenhum. Só diga que concluiu a ação na resposta
  em texto se realmente chamou a função pra todos os itens correspondentes.
- Precisão de linguagem: escreva em português correto, natural, sem erros de
  concordância, pontuação ou acentuação — inclusive vírgulas. A resposta em
  texto deve parecer escrita por alguém atento a cada detalhe da frase, não um
  rascunho.
`.trim()

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  // Rede de segurança geral: qualquer exceção inesperada em qualquer ponto
  // daqui pra baixo (não só na chamada ao Gemini) vira uma resposta JSON
  // legível, em vez de um 500 cru sem mensagem nenhuma.
  try {
    return await handleRequest(event)
  } catch (err) {
    return jsonResponse(500, { error: `Erro inesperado no servidor: ${err.message}` })
  }
}

async function handleRequest(event) {
  const t0 = Date.now()
  const mark = label => console.log(`[TIMING] ${label}: ${Date.now() - t0}ms`)

  const { user, error: authError } = await getVerifiedUser(event)
  mark('getVerifiedUser')
  if (!user) {
    return jsonResponse(401, { error: authError })
  }

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  mark('profiles.select')

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
    mark('profiles.upsert (perfil novo)')

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
    mark('ai_usage.select')

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
    mark('ai_usage.upsert')

    if (usageError) {
      return jsonResponse(500, { error: `Erro ao registrar uso: ${usageError.message}` })
    }

    remaining = profile.daily_limit - (currentCount + 1)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse(500, { error: 'GEMINI_API_KEY não configurada no servidor.' })
  }

  let messages = []
  let context = {}
  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {}
    messages = parsedBody.messages || []
    context = parsedBody.context || {}
  } catch {
    return jsonResponse(400, { error: 'Não consegui interpretar o pedido enviado (JSON inválido).' })
  }

  // Reduz o tamanho do contexto mandado pro modelo: mantém só os campos que a
  // IA de fato usa pra decidir/gerar ações (id/kind/period/weekday/valueId/text).
  // Campos como "time", "parentId" e "recurring" nunca influenciam uma decisão
  // dela, só engordam a mensagem — e o contexto só tende a crescer conforme o
  // usuário cadastra mais itens, então isso ajuda a manter a resposta rápida.
  if (Array.isArray(context.checklistItems)) {
    context.checklistItems = context.checklistItems.map(i => ({
      id: i.id,
      kind: i.kind,
      ...(i.period ? { period: i.period } : {}),
      ...(i.weekday != null ? { weekday: i.weekday } : {}),
      ...(i.valueId ? { valueId: i.valueId } : {}),
      text: i.text
    }))
  }

  const tools = [
    {
      type: 'function',
      function: {
        name: 'toggle_item',
        description: 'Marca ou desmarca (alterna) um item de checklist existente como concluído no dia de hoje.',
        parameters: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'id EXATO do item, copiado do contexto — nunca invente.' }
          },
          required: ['itemId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_value',
        description: 'Cria um novo valor pessoal (categoria de checklist). Use junto com add_valor_item pra popular os itens dele na mesma resposta.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do valor novo.' },
            description: { type: 'string', description: 'Descrição curta opcional (pode ser vazia).' }
          },
          required: ['name']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_valor_item',
        description: 'Adiciona um item de checklist a um valor já existente (ou recém-criado com create_value na mesma resposta).',
        parameters: {
          type: 'object',
          properties: {
            valueId: { type: 'string', description: 'id do valor existente no contexto, OU o nome exato usado em um create_value na mesma resposta.' },
            text: { type: 'string', description: 'Texto do novo item de checklist — concreto e realizável em um dia.' }
          },
          required: ['valueId', 'text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_rotina_item',
        description: 'Adiciona um novo item de rotina (hábito) em um período do dia. Pra "todos os dias da semana", omita o campo weekday por completo — NÃO chame essa função 7 vezes.',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['manha', 'tarde', 'noite'], description: 'Período do dia, exatamente um destes três valores.' },
            text: { type: 'string', description: 'Texto do novo item de rotina — concreto e realizável em um dia.' },
            weekday: { type: 'integer', description: 'Dia da semana (0=domingo...6=sábado). OMITA este campo por completo se o item deve repetir todo dia da semana.' },
            time: { type: 'string', description: 'Horário opcional no formato HH:MM (24h). Só inclua se o usuário mencionar um horário explícito.' }
          },
          required: ['period', 'text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'edit_item',
        description: 'Edita o texto de um item de checklist (rotina ou valor) que já existe. Nunca cria um item novo — use quando o pedido for "editar/corrigir/renomear/trocar o texto de" algo existente.',
        parameters: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'id EXATO do item existente, copiado do contexto.' },
            text: { type: 'string', description: 'Novo texto do item.' }
          },
          required: ['itemId', 'text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'remove_item',
        description: 'Remove um item de checklist (rotina ou valor) que já existe.',
        parameters: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'id EXATO do item existente a remover, copiado do contexto — procure pelo texto mais parecido, nunca invente um id.' }
          },
          required: ['itemId']
        }
      }
    }
  ]

  const payload = {
    model: MODEL,
    temperature: 0.4,
    max_tokens: 12000,
    reasoning_effort: 'low',
    tools,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `Contexto atual em JSON: ${JSON.stringify(context)}` },
      ...messages
    ]
  }

  async function callGemini() {
    return fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })
  }

  try {
    // O Gemini gratuito às vezes fica sobrecarregado (503 UNAVAILABLE) —
    // isso é temporário, então tentamos de novo automaticamente 1x antes
    // de desistir, com uma pequena espera.
    mark('antes da chamada ao Gemini')
    let upstream = await callGemini()
    mark('Gemini respondeu')

    if (upstream.status === 503) {
      await new Promise(resolve => setTimeout(resolve, 2900))
      upstream = await callGemini()
    }

    if (!upstream.ok) {
      const text = await upstream.text()
      let friendly = 'O assistente está indisponível no momento. Tenta de novo em alguns segundos.'
      try {
        const errJson = JSON.parse(text)
        const msg = errJson?.error?.message || errJson?.[0]?.error?.message
        if (msg) friendly = `Erro do Gemini: ${msg}`
      } catch {
        // mantém a mensagem genérica se não der pra interpretar o erro
      }
      return jsonResponse(upstream.status === 503 ? 503 : upstream.status, { error: friendly })
    }

    const data = await upstream.json()
    mark('JSON do Gemini interpretado')
    const message = data.choices?.[0]?.message || {}

    // Function calling nativo: cada ação que o Gemini decide tomar chega como
    // uma chamada de função independente e já validada (nome + argumentos),
    // em vez de um bloco de JSON gigante que ele preenchia "na confiança" e
    // podia ficar incompleto ou até vazio apesar do texto dizer que fez algo.
    const actions = []
    for (const call of message.tool_calls || []) {
      if (call.type !== 'function' || !call.function?.name) continue
      let args = {}
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
      } catch {
        continue // argumentos malformados nessa chamada específica — ignora só essa
      }
      actions.push({ type: call.function.name, ...args })
    }

    let reply = typeof message.content === 'string' ? message.content.trim() : ''
    if (!reply) {
      // Function calling permite o modelo responder só com tool_calls, sem
      // texto — nesse caso geramos uma confirmação simples em vez de deixar
      // a resposta vazia (que era exatamente o sintoma de "(sem resposta)").
      reply = actions.length > 0
        ? 'Feito!'
        : 'Não entendi exatamente o que fazer com isso — pode reformular?'
    }

    const parsed = { reply, actions, remaining, isAdmin: profile.is_admin }

    // LOG TEMPORÁRIO DE DIAGNÓSTICO — mostra exatamente o que o Gemini gerou
    console.log('[DEBUG ai.js] tool_calls geradas pelo Gemini:', JSON.stringify(actions, null, 2))
    console.log('[DEBUG ai.js] reply gerada pelo Gemini:', reply)

    return jsonResponse(200, parsed)
  } catch (err) {
    return jsonResponse(500, { error: `Falha ao chamar o Gemini: ${err.message}` })
  }
}