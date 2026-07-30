import { useState } from 'react'
import ValueSection from './ValueSection.jsx'
import RotinaView from './RotinaView.jsx'
import { getWeekDates } from '../utils/dates.js'

export default function TodayView({
  data, dayFor, progressForValue,
  toggleItem, setNote,
  addValorItem, addRotinaItem, removeChecklistItem,
  updateItemText, moveItem
}) {
  const weekDates = getWeekDates()
  const today = weekDates.find(d => d.isToday)
  const [selected, setSelected] = useState(today ? today.key : weekDates[0].key)

  const selectedDay = weekDates.find(d => d.key === selected)
  const day = dayFor(selected)
  const rotinaItems = data.checklistItems.filter(i => i.kind === 'rotina')

  return (
    <div>
      <div className="day-tabs">
        {weekDates.map(d => (
          <button
            key={d.key}
            className={`day-tab${d.key === selected ? ' active' : ''}${d.isToday ? ' today' : ''}`}
            onClick={() => setSelected(d.key)}
          >
            {d.short}
          </button>
        ))}
      </div>

      <h2 className="day-heading">{selectedDay ? selectedDay.label : ''}</h2>

      <div className="today-group">
        <RotinaView
          items={rotinaItems}
          weekday={selectedDay ? selectedDay.weekday : 0}
          completions={day.completions}
          onToggle={(itemId) => toggleItem(itemId, selected)}
          onAddItem={addRotinaItem}
          onRemoveItem={removeChecklistItem}
          onEditText={updateItemText}
          onMoveItem={moveItem}
        />
      </div>

      {data.values.length > 0 && (
        <div className="today-group">
          <h2 className="today-group-title">Valores</h2>
          {data.values.map(value => (
            <ValueSection
              key={value.id}
              value={value}
              items={data.checklistItems.filter(i => i.kind === 'valor' && i.valueId === value.id)}
              completions={day.completions}
              notes={day.notes}
              progress={progressForValue(value.id, selected)}
              onToggle={(itemId) => toggleItem(itemId, selected)}
              onNoteChange={(itemId, text) => setNote(itemId, selected, text)}
              onAddItem={addValorItem}
              onRemoveItem={removeChecklistItem}
              onEditText={updateItemText}
              onMoveItem={moveItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}