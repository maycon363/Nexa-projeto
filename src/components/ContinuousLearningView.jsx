import { DAILY_LEARNINGS, getTodayLearning } from '../data/dailyLearnings.js'

export default function ContinuousLearningView() {
  const today = getTodayLearning()
  const previous = DAILY_LEARNINGS
    .map((item, i) => ({ ...item, index: i }))
    .filter(item => item.index !== today.index)

  return (
    <div>
      <section className="value-section learning-today">
        <p className="learning-eyebrow">Aprendizado de hoje</p>
        <h2 className="learning-today-title">{today.title}</h2>
        <p className="learning-today-body">{today.body}</p>
      </section>

      <h2 className="today-group-title">Outros aprendizados</h2>
      <div className="learning-archive">
        {previous.map(item => (
          <div className="learning-card" key={item.index}>
            <h3 className="learning-card-title">{item.title}</h3>
            <p className="learning-card-body">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}