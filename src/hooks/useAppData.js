import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultData } from '../data/defaultData.js'
import { supabase } from '../services/supabaseClient.js'

const LOCAL_STORAGE_KEY = 'nexa:data' // usado só para a migração única do que já existia no navegador

function pad(n) { return String(n).padStart(2, '0') }
function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function emptyDay() {
  return { completions: {}, notes: {} }
}

// Gera um id único mesmo quando duas chamadas acontecem no mesmo milissegundo
// (ex: a IA sugerindo dois itens na mesma resposta).
function uniqueId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useAppData(userId) {
  const [data, setData] = useState(null) // null enquanto carrega do Supabase
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const todayKey = useMemo(() => dateKey(new Date()), [])
  const loadedRef = useRef(false)
  const saveTimer = useRef(null)
  const pendingDataRef = useRef(null) // sempre aponta pro "data" mais recente ainda não salvo

  useEffect(() => {
    if (!userId) return
    loadedRef.current = false
    setLoading(true)
    setError(null)

    async function load() {
      const { data: row, error: selectError } = await supabase
        .from('nexa_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle()

      if (selectError) {
        setError(selectError.message)
        setLoading(false)
        return
      }

      if (row) {
        setData({ ...structuredClone(defaultData), ...row.data })
      } else {
        let initial = structuredClone(defaultData)
        try {
          const local = localStorage.getItem(LOCAL_STORAGE_KEY)
          if (local) initial = { ...initial, ...JSON.parse(local) }
        } catch {
          // ignora
        }

        const { error: insertError } = await supabase
          .from('nexa_data')
          .upsert({ user_id: userId, data: initial }, { onConflict: 'user_id', ignoreDuplicates: false })

        if (insertError) setError(insertError.message)
        setData(initial)
      }

      loadedRef.current = true
      setLoading(false)
    }

    load()
  }, [userId])

  // Função que grava de verdade no Supabase — usada tanto pelo debounce
  // normal quanto pelo "salvamento forçado" quando a aba sai de foco.
  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (!userId || !pendingDataRef.current) return

    const toSave = pendingDataRef.current
    pendingDataRef.current = null

    const { error: upsertError } = await supabase
      .from('nexa_data')
      .upsert({ user_id: userId, data: toSave, updated_at: new Date().toISOString() })

    if (upsertError) setError(upsertError.message)
  }, [userId])

  useEffect(() => {
    if (!userId || !data || !loadedRef.current) return

    pendingDataRef.current = data

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      flushSave()
    }, 400)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data, userId, flushSave])

  // Celular costuma suspender/matar a aba assim que você troca de app ou
  // tranca a tela — se isso acontecer antes do atraso acima disparar, a
  // gravação nunca sai. Por isso, força salvar na hora nesses momentos.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') flushSave()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushSave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flushSave)
    }
  }, [flushSave])

  const dayFor = useCallback((key) => {
    if (!data) return emptyDay()
    const day = data.dailyCycles[key]
    if (!day) return emptyDay()
    return { completions: day.completions || {}, notes: day.notes || {} }
  }, [data])

  const toggleItem = useCallback((itemId, dayKeyStr) => {
    setData(prev => {
      if (!prev) return prev
      const raw = prev.dailyCycles[dayKeyStr]
      const day = raw ? { completions: raw.completions || {}, notes: raw.notes || {} } : emptyDay()
      return {
        ...prev,
        dailyCycles: {
          ...prev.dailyCycles,
          [dayKeyStr]: { ...day, completions: { ...day.completions, [itemId]: !day.completions[itemId] } }
        }
      }
    })
  }, [])

  const setNote = useCallback((itemId, dayKeyStr, text) => {
    setData(prev => {
      if (!prev) return prev
      const raw = prev.dailyCycles[dayKeyStr]
      const day = raw ? { completions: raw.completions || {}, notes: raw.notes || {} } : emptyDay()
      return {
        ...prev,
        dailyCycles: {
          ...prev.dailyCycles,
          [dayKeyStr]: { ...day, notes: { ...day.notes, [itemId]: text } }
        }
      }
    })
  }, [])

  const addValue = useCallback((name, description) => {
    const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
    setData(prev => (prev ? { ...prev, values: [...prev.values, { id, name, description }] } : prev))
    return id
  }, [])

  // Apaga um valor (tópico) inteiro e todos os itens de checklist ligados a
  // ele — diferente de removeChecklistItem, que apaga só um item por vez.
  // É a "lixeira por tópico" pedida: some com aquele valor específico, sem
  // mexer nos outros.
  const removeValue = useCallback((valueId) => {
    setData(prev => (prev ? {
      ...prev,
      values: prev.values.filter(v => v.id !== valueId),
      checklistItems: prev.checklistItems.filter(i => !(i.kind === 'valor' && i.valueId === valueId))
    } : prev))
  }, [])

  // Preferências (mostrar/esconder seções etc). Faz merge raso — só precisa
  // passar as chaves que estão mudando.
  const updateSettings = useCallback((patch) => {
    setData(prev => (prev ? {
      ...prev,
      settings: { ...(prev.settings || {}), ...patch }
    } : prev))
  }, [])

  // ---- Mapeamento de hábitos livre (estilo "cartão de hábitos" do livro) ----
  // Cada hábito aqui é independente do checklist de rotina/valores: a pessoa
  // só descreve o hábito (ex: "lavar as mãos depois do banheiro") e classifica
  // (ou deixa a IA classificar) como bom, ruim ou neutro.
  const addHabit = useCallback((text) => {
    const id = uniqueId('habit')
    const habit = { id, text, classification: null, note: '', createdAt: new Date().toISOString() }
    setData(prev => (prev ? { ...prev, habits: [...(prev.habits || []), habit] } : prev))
    return id
  }, [])

  const removeHabit = useCallback((habitId) => {
    setData(prev => (prev ? {
      ...prev,
      habits: (prev.habits || []).filter(h => h.id !== habitId)
    } : prev))
  }, [])

  // classification: 'bom' | 'ruim' | 'neutro'. source: 'ia' | 'manual' — só
  // pra saber depois se foi a pessoa ou o assistente quem classificou.
  const classifyHabit = useCallback((habitId, classification, source = 'manual', note = undefined) => {
    setData(prev => (prev ? {
      ...prev,
      habits: (prev.habits || []).map(h => (
        h.id === habitId
          ? { ...h, classification, classifiedBy: source, ...(note !== undefined ? { note } : {}) }
          : h
      ))
    } : prev))
  }, [])

  const addValorItem = useCallback((valueId, text) => {
    const id = uniqueId(valueId)
    setData(prev => (prev ? {
      ...prev,
      checklistItems: [...prev.checklistItems, { id, kind: 'valor', valueId, text, recurring: true }]
    } : prev))
    return id
  }, [])

  // Agora aceita um horário opcional (formato "HH:MM") e um parentId opcional
  // — quando parentId é informado, o item nasce como subtarefa de outro item.
  const addRotinaItem = useCallback((period, text, weekday, time = null, parentId = null) => {
    const id = uniqueId(`rotina-${period}`)
    setData(prev => (prev ? {
      ...prev,
      checklistItems: [...prev.checklistItems, { id, kind: 'rotina', period, weekday, text, time: time || null, parentId, recurring: true }]
    } : prev))
    return id
  }, [])

  // Cria uma subtarefa vinculada a um item já existente. Herda
  // period/weekday/valueId do item pai automaticamente.
  const addSubTask = useCallback((parentId, text) => {
    setData(prev => {
      if (!prev) return prev
      const parent = prev.checklistItems.find(i => i.id === parentId)
      if (!parent) return prev
      const id = uniqueId(`sub-${parentId}`)
      const newItem = {
        id, kind: parent.kind, period: parent.period, weekday: parent.weekday,
        valueId: parent.valueId, text, time: null, parentId, recurring: true
      }
      return { ...prev, checklistItems: [...prev.checklistItems, newItem] }
    })
  }, [])

  // Remover um item agora também remove suas subtarefas, senão elas ficariam
  // órfãs (visíveis em nenhum lugar, mas ainda ocupando espaço nos dados).
  const removeChecklistItem = useCallback((itemId) => {
    setData(prev => (prev ? {
      ...prev,
      checklistItems: prev.checklistItems.filter(i => i.id !== itemId && i.parentId !== itemId)
    } : prev))
  }, [])

  const updateItemText = useCallback((itemId, text) => {
    setData(prev => (prev ? {
      ...prev,
      checklistItems: prev.checklistItems.map(i => (i.id === itemId ? { ...i, text } : i))
    } : prev))
  }, [])

  // Atualiza (ou limpa, se time for vazio) o horário de lembrete de um item.
  const updateItemTime = useCallback((itemId, time) => {
    setData(prev => (prev ? {
      ...prev,
      checklistItems: prev.checklistItems.map(i => (i.id === itemId ? { ...i, time: time || null } : i))
    } : prev))
  }, [])

  const moveItem = useCallback((itemId, direction) => {
    setData(prev => {
      if (!prev) return prev
      const items = [...prev.checklistItems]
      const idx = items.findIndex(i => i.id === itemId)
      if (idx === -1) return prev
      const item = items[idx]

      const sameGroup = (i) => item.kind === 'rotina'
        ? i.kind === 'rotina' && i.period === item.period && i.weekday === item.weekday && i.parentId === item.parentId
        : i.kind === 'valor' && i.valueId === item.valueId

      let neighborIdx = -1
      if (direction === 'up') {
        for (let j = idx - 1; j >= 0; j--) {
          if (sameGroup(items[j])) { neighborIdx = j; break }
        }
      } else {
        for (let j = idx + 1; j < items.length; j++) {
          if (sameGroup(items[j])) { neighborIdx = j; break }
        }
      }
      if (neighborIdx === -1) return prev

      const tmp = items[idx]
      items[idx] = items[neighborIdx]
      items[neighborIdx] = tmp
      return { ...prev, checklistItems: items }
    })
  }, [])

  const progressForValue = useCallback((valueId, dayKeyStr) => {
    if (!data) return 0
    const items = data.checklistItems.filter(i => i.kind === 'valor' && i.valueId === valueId)
    if (items.length === 0) return 0
    const day = dayFor(dayKeyStr)
    const done = items.filter(i => day.completions[i.id]).length
    return done / items.length
  }, [data, dayFor])

  const exportJSON = useCallback(() => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexa-${todayKey}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, todayKey])

  const importJSON = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        setData({ ...structuredClone(defaultData), ...parsed })
      } catch (e) {
        console.error('JSON inválido', e)
        alert('Não consegui ler esse arquivo — verifique se é um JSON exportado por este app.')
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    data, todayKey, dayFor, loading, error,
    toggleItem, setNote,
    addValue, removeValue, addValorItem, addRotinaItem, addSubTask, removeChecklistItem,
    updateItemText, updateItemTime, moveItem,
    updateSettings,
    addHabit, removeHabit, classifyHabit,
    progressForValue, exportJSON, importJSON
  }
}