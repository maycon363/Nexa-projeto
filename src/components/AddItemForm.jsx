
import { useState } from 'react'

export default function AddItemForm({ onAdd }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  return (
    <form className="add-item-row" onSubmit={submit}>
      <input
        type="text"
        placeholder="Adicionar novo item para esse valor…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button type="submit">Adicionar</button>
    </form>
  )
}