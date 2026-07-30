import ProofStamp from './ProofStamp.jsx'
import ChecklistItem from './ChecklistItem.jsx'
import AddItemForm from './AddItemForm.jsx'

export default function ValueSection({ value, items, completions = {}, notes = {}, progress, onToggle, onNoteChange, onAddItem, onRemoveItem, onEditText, onMoveItem }) {
  return (
    <section className="value-section">
      <div className="value-section-head">
        <ProofStamp progress={progress} />
        <div>
          <h2>{value.name}</h2>
          {value.description && <p>{value.description}</p>}
        </div>
      </div>

      <ul className="checklist">
        {items.map((item, i) => (
          <ChecklistItem
            key={item.id}
            item={item}
            done={Boolean(completions[item.id])}
            note={notes[item.id]}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            onToggle={() => onToggle(item.id)}
            onNoteChange={(text) => onNoteChange(item.id, text)}
            onEditText={(text) => onEditText(item.id, text)}
            onMoveUp={() => onMoveItem(item.id, 'up')}
            onMoveDown={() => onMoveItem(item.id, 'down')}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </ul>

      <AddItemForm onAdd={(text) => onAddItem(value.id, text)} />
    </section>
  )
}