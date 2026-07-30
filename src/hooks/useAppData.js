import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultData } from '../data/defaultData.js'
import { supabase } from '../services/supabaseClient.js'

const LOCAL_STORAGE_KEY = 'nexa:data' 

function pad(n) { return String(n).padStart(2, '0') }
function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function emptyDay() {
  return { completions: {}, notes: {} }
}

// Gera um id único mesmo quando duas chamadas acontecem no mesmo milissegundo
function uniqueId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useAppData(userId) {
  const [data, setData] = useState(null) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const todayKey = useMemo(() => dateKey(new Date()), [])
  const loadedRef = useRef(false)
  const saveTimer = useRef(null)

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
          // ignora — se o localStorage estiver corrompido, só segue com o padrão
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

  useEffect(() => {
    if (!userId || !data || !loadedRef.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { error: upsertError } = await supabase
        .from('nexa_data')
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
      if (upsertError) setError(upsertError.message)
    }, 600)

    return () => clearTimeout(saveTimer.current)
  }, [data, userId])

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

  const addValorItem = useCallback((valueId, text) => {
    const id = uniqueId(valueId)
    setData(prev => (prev ? {
      ...prev,
      checklistItems: [...prev.checklistItems, { id, kind: 'valor', valueId, text, recurring: true }]
    } : prev))
    return id
  }, [])

  const addRotinaItem = useCallback((period, text, weekday) => {
    const id = uniqueId(`rotina-${period}`)
    setData(prev => (prev ? {
      ...prev,
      checklistItems: [...prev.checklistItems, { id, kind: 'rotina', period, weekday, text, recurring: true }]
    } : prev))
    return id
  }, [])

  const removeChecklistItem = useCallback((itemId) => {
    setData(prev => (prev ? { ...prev, checklistItems: prev.checklistItems.filter(i => i.id !== itemId) } : prev))
  }, [])

  const updateItemText = useCallback((itemId, text) => {
    setData(prev => (prev ? {
      ...prev,
      checklistItems: prev.checklistItems.map(i => (i.id === itemId ? { ...i, text } : i))
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
        ? i.kind === 'rotina' && i.period === item.period && i.weekday === item.weekday
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
    addValue, addValorItem, addRotinaItem, removeChecklistItem,
    updateItemText, moveItem,
    progressForValue, exportJSON, importJSON
  }
}