import { useState } from 'react'
import ValueSection from './ValueSection.jsx'
import RotinaView from './RotinaView.jsx'
import HabitScorecard from './HabitScorecard.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { TrashIcon } from './Icons.jsx'
import { getWeekDates } from '../utils/dates.js'

export default function TodayView({
  data, dayFor, progressForValue,
  toggleItem, setNote,
  addValorItem, addRotinaItem, addSubTask, removeChecklistItem,
  updateItemText, updateItemTime, moveItem,
  removeValue,
  addHabit, removeHabit, classifyHabit
}) {
  const weekDates = getWeekDates()
  const today = weekDates.find(d => d.isToday)
  const [selected, setSelected] = useState(today ? today.key : weekDates[0].key)
  const [valueToDelete, setValueToDelete] = useState(null) // { id, name } | null

  const selectedDay = weekDates.find(d => d.key === selected)
  const day = dayFor(selected)
  const rotinaItems = data.checklistItems.filter(i => i.kind === 'rotina')
  const settings = data.settings || { showValues: true, showHabitScorecard: true }

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

      {/* A rotina é sempre o padrão fixo desta tela — não tem como esconder. */}
      <div className="today-group">
        <RotinaView
          items={rotinaItems}
          weekday={selectedDay ? selectedDay.weekday : 0}
          completions={day.completions}
          onToggle={(itemId) => toggleItem(itemId, selected)}
          onAddItem={addRotinaItem}
          onAddSubTask={addSubTask}
          onRemoveItem={removeChecklistItem}
          onEditText={updateItemText}
          onEditTime={updateItemTime}
          onMoveItem={moveItem}
        />
      </div>

      {settings.showHabitScorecard && (
        <div className="today-group">
          <HabitScorecard
            habits={data.habits || []}
            onAdd={addHabit}
            onClassify={classifyHabit}
            onRemove={removeHabit}
          />
        </div>
      )}

      {settings.showValues && data.values.length > 0 && (
        <div className="today-group">
          <h2 className="today-group-title">Valores</h2>
          {data.values.map(value => (
            <div className="value-section-wrap" key={value.id}>
              <button
                className="value-section-delete"
                onClick={() => setValueToDelete({ id: value.id, name: value.name })}
                title={`Apagar o valor "${value.name}" inteiro`}
              >
                <TrashIcon size={15} />
              </button>
              <ValueSection
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
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(valueToDelete)}
        title="Apagar este valor?"
        message={valueToDelete ? `Isso apaga o valor "${valueToDelete.name}" e todos os itens dele — só esse tópico, os outros continuam intactos. Essa ação não tem volta.` : ''}
        confirmLabel="Apagar"
        tone="danger"
        onCancel={() => setValueToDelete(null)}
        onConfirm={() => {
          removeValue(valueToDelete.id)
          setValueToDelete(null)
        }}
      />
    </div>
  )
}