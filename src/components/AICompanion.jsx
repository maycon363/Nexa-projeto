import { useEffect, useRef, useState } from 'react'
import { askAssistant } from '../services/aiService.js'
import NexaLoader from './NexaLoader.jsx'
import NexaMark from './NexaMark.jsx'
import { getTodayLearning } from '../data/dailyLearnings.js'

const DEFAULT_GREETING = {
  role: 'assistant',
  content: 'Oi! Eu vejo em qual tela do app você está, então posso ajudar com o que estiver ali na hora — marcar, adicionar, editar ou remover itens, ou só explicar o que você tá vendo.'
}

function chatStorageKey(userId) {
  return `nexa:chatLog:${userId}`
}

function loadStoredLog(userId) {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId))
    if (!raw) return [DEFAULT_GREETING]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_GREETING]
  } catch {
    return [DEFAULT_GREETING]
  }
}

// Resumos curtos, calculados a partir de dados que já estão no navegador (sem
// nenhuma chamada extra) — só pra dar contexto do que a pessoa está vendo
// naquela tela específica, sem mandar tudo sempre.
function computeDiagnosticsSummary(data) {
  const dayKeys = Object.keys(data.dailyCycles).sort((a, b) => b.localeCompare(a)).slice(0, 30)
  if (dayKeys.length === 0) return 'Ainda não há dias registrados no Histórico.'

  const results = data.values.map(value => {
    const items = data.checklistItems.filter(i => i.kind === 'valor' && i.valueId === value.id)
    if (items.length === 0) return null
    let done = 0
    const total = items.length * dayKeys.length
    dayKeys.forEach(key => {
      const completions = data.dailyCycles[key]?.completions || {}
      items.forEach(item => { if (completions[item.id]) done += 1 })
    })
    return { name: value.name, pct: Math.round((done / total) * 100) }
  }).filter(Boolean).sort((a, b) => b.pct - a.pct)

  if (results.length === 0) return 'Ainda não há valores com itens suficientes pra diagnosticar.'
  const top = results.slice(0, 3).map(r => `${r.name} ${r.pct}%`).join(', ')
  const bottom = results.slice(-3).map(r => `${r.name} ${r.pct}%`).join(', ')
  return `Diagnóstico de valores (últimos ${dayKeys.length} dias) — mais fortes: ${top}. A desenvolver: ${bottom}.`
}

function buildScreenSummary(activeTab, data) {
  if (activeTab === 'historico') return computeDiagnosticsSummary(data)
  if (activeTab === 'aprendizado') {
    const learning = getTodayLearning()
    return `Aprendizado de hoje na tela: "${learning.title}" — ${learning.body}`
  }
  return null
}

export default function AICompanion({ data, todayKey, todayWeekday, todayCompletions, userId, activeTab, onToggle, onCreateValue, onAddValorItem, onAddRotinaItem, onEditItem, onRemoveItem }) {
  const [log, setLog] = useState(() => loadStoredLog(userId))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [limitReached, setLimitReached] = useState(false)
  const logRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(chatStorageKey(userId), JSON.stringify(log))
    } catch {
      // localStorage cheio/bloqueado: só segue sem persistir
    }
  }, [log, userId])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log, loading])

  useEffect(() => {
    function handlePrefill(e) {
      if (typeof e.detail === 'string') setInput(e.detail)
    }
    window.addEventListener('nexa:prefillChat', handlePrefill)
    return () => window.removeEventListener('nexa:prefillChat', handlePrefill)
  }, [])

  function buildContext() {
    return {
      current_screen: activeTab,
      screen_summary: buildScreenSummary(activeTab, data),
      today_weekday: todayWeekday,
      values: data.values,
      checklistItems: data.checklistItems,
      completions: todayCompletions
    }
  }

  function resolveValueId(rawId, workingValues) {
    if (!rawId) return null
    const target = String(rawId).trim().toLowerCase()
    const exact = workingValues.find(v => v.id === rawId)
    if (exact) return exact.id
    const byId = workingValues.find(v => v.id.toLowerCase() === target)
    if (byId) return byId.id
    const byName = workingValues.find(v => v.name.toLowerCase() === target)
    return byName ? byName.id : null
  }

  function itemExists(itemId) {
    return data.checklistItems.some(i => i.id === itemId)
  }

  function applyActions(actions = []) {
    const failures = []
    const workingValues = [...data.values]

    for (const action of actions) {
      if (action.type === 'toggle_item' && action.itemId) {
        if (itemExists(action.itemId)) onToggle(action.itemId, todayKey)
        else failures.push(action)
      } else if (action.type === 'create_value' && action.name) {
        const newId = onCreateValue(action.name.trim(), action.description || '')
        workingValues.push({ id: newId, name: action.name.trim(), description: action.description || '' })
      } else if (action.type === 'add_valor_item' && action.valueId && action.text) {
        const resolvedId = resolveValueId(action.valueId, workingValues)
        if (resolvedId) onAddValorItem(resolvedId, action.text)
        else failures.push(action)
      } else if (action.type === 'add_rotina_item' && action.period && action.text) {
        const weekday = typeof action.weekday === 'number' ? action.weekday : todayWeekday
        const time = typeof action.time === 'string' && /^\d{2}:\d{2}$/.test(action.time) ? action.time : null
        onAddRotinaItem(action.period, action.text, weekday, time)
      } else if (action.type === 'edit_item' && action.itemId && action.text) {
        if (itemExists(action.itemId)) onEditItem(action.itemId, action.text)
        else failures.push(action)
      } else if (action.type === 'remove_item' && action.itemId) {
        if (itemExists(action.itemId)) onRemoveItem(action.itemId)
        else failures.push(action)
      }
    }
    return failures
  }

  async function send() {
    const text = input.trim()
    if (!text || loading || limitReached) return

    const nextLog = [...log, { role: 'user', content: text }]
    setLog(nextLog)
    setInput('')
    setLoading(true)

    try {
      const result = await askAssistant({
        messages: nextLog.map(m => ({ role: m.role, content: m.content })),
        context: buildContext()
      })
      const failures = applyActions(result.actions)
      let replyText = result.reply || '(sem resposta)'
      if (failures.length > 0) {
        replyText += '\n\n(Aviso: não consegui aplicar tudo — algum item/valor citado não bateu com o que existe. Confere se o nome está certo e tenta de novo.)'
      }
      setLog(l => [...l, { role: 'assistant', content: replyText }])
      setRemaining(typeof result.remaining === 'number' ? result.remaining : null)
    } catch (err) {
      setLog(l => [...l, { role: 'assistant', content: err.message }])
      if (err.isLimitReached) setLimitReached(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-body">
      <div className="ai-log" ref={logRef}>
        {log.map((m, i) => (
          <div key={i} className={`ai-row ${m.role}`}>
            {m.role === 'assistant' && (
              <span className="ai-avatar"><NexaMark size={14} /></span>
            )}
            <div className={`ai-msg ${m.role}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-row assistant">
            <span className="ai-avatar"><NexaMark size={14} /></span>
            <div className="ai-msg assistant ai-loading-row ai-loading-focus">
              <NexaLoader size={24} />
            </div>
          </div>
        )}
      </div>

      {remaining !== null && !limitReached && (
        <p className="ai-remaining">{remaining} mensagem{remaining === 1 ? '' : 's'} restante{remaining === 1 ? '' : 's'} hoje</p>
      )}

      <div className="ai-input-row">
        <input
          type="text"
          placeholder={limitReached ? 'Limite diário atingido' : 'Ex: adiciona ler livro na rotina de amanhã'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading || limitReached}
        />
        <button className="ai-send-btn" onClick={send} disabled={loading || limitReached || !input.trim()} aria-label="Enviar">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 10L17 3L12.5 17.5L9.5 11.5L2.5 10Z" fill="currentColor" />
            <path d="M9.5 11.5L17 3" stroke="var(--color-bg)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}