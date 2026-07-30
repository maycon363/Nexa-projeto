import { useEffect, useRef, useState } from 'react'
import { askAssistant } from '../services/aiService.js'
import NexaLoader from './NexaLoader.jsx'
import NexaMark from './NexaMark.jsx'

const DEFAULT_GREETING = { role: 'assistant', content: 'Oi! Posso marcar, adicionar ou remover itens da sua rotina e valores. É só me pedir.' }

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

export default function AICompanion({ data, todayKey, todayWeekday, todayCompletions, userId, onToggle, onCreateValue, onAddValorItem, onAddRotinaItem, onEditItem, onRemoveItem }) {
  const [log, setLog] = useState(() => loadStoredLog(userId))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [limitReached, setLimitReached] = useState(false)
  const logRef = useRef(null)

  // Salva a conversa a cada mudança, pra sobreviver a recarregar a página ou
  // fechar e abrir o chat de novo.
  useEffect(() => {
    try {
      localStorage.setItem(chatStorageKey(userId), JSON.stringify(log))
    } catch {
      // se o localStorage estiver cheio/bloqueado, só segue sem persistir
    }
  }, [log, userId])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log, loading])

  // Recebe o texto de exemplo clicado na aba "Aprenda" e já preenche o campo.
  useEffect(() => {
    function handlePrefill(e) {
      if (typeof e.detail === 'string') setInput(e.detail)
    }
    window.addEventListener('nexa:prefillChat', handlePrefill)
    return () => window.removeEventListener('nexa:prefillChat', handlePrefill)
  }, [])

  function buildContext() {
    return {
      today_weekday: todayWeekday, // 0=domingo ... 6=sábado
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
        onAddRotinaItem(action.period, action.text, weekday)
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