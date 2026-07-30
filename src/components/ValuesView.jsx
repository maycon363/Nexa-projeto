import { useState } from 'react'

export default function ValuesView({ data, todayCompletions, addValue, addValorItem, toggleToday, removeChecklistItem }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    addValue(name.trim(), desc.trim())
    setName('')
    setDesc('')
  }

  return (
    <div>
      <section className="value-section">
        <div className="value-section-head">
          <div>
            <h2>Novo valor</h2>
            <p>Cada valor vira uma seção com seu próprio checklist, marcado dia a dia.</p>
          </div>
        </div>
        <form className="add-item-row" onSubmit={submit}>
          <input placeholder="Nome (ex: Disciplina)" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Descrição curta (opcional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <button type="submit">Criar</button>
        </form>
      </section>

      <p className="empty-state" style={{ marginBottom: 14 }}>
        As caixinhas aqui marcam o dia de <strong>hoje</strong>. Pra marcar outro dia, use a aba "Hoje" e escolha o dia lá em cima.
      </p>

      {data.values.map(value => (
        <section className="value-section" key={value.id}>
          <div className="value-section-head">
            <div>
              <h2>{value.name}</h2>
              {value.description && <p>{value.description}</p>}
            </div>
          </div>
          <ul className="checklist">
            {data.checklistItems.filter(i => i.kind === 'valor' && i.valueId === value.id).map(item => {
              const done = Boolean(todayCompletions[item.id])
              return (
                <li className="checklist-item" key={item.id}>
                  <button
                    className={`check-box${done ? ' checked' : ''}`}
                    onClick={() => toggleToday(item.id)}
                    aria-pressed={done}
                    aria-label={done ? 'Marcar como não feito' : 'Marcar como feito'}
                  >
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.2 8.2L11 1" stroke="var(--color-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="item-body">
                    <div className={`item-text${done ? ' done' : ''}`}>{item.text}</div>
                  </div>
                  <button className="item-remove" onClick={() => removeChecklistItem(item.id)}>✕</button>
                </li>
              )
            })}
          </ul>
          <ItemForm onAdd={text => addValorItem(value.id, text)} />
        </section>
      ))}
    </div>
  )
}

function ItemForm({ onAdd }) {
  const [text, setText] = useState('')
  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }
  return (
    <form className="add-item-row" onSubmit={submit}>
      <input placeholder="Novo item para esse valor…" value={text} onChange={e => setText(e.target.value)} />
      <button type="submit">Adicionar</button>
    </form>
  )
}