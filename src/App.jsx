import { useState } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useAppData } from './hooks/useAppData.js'
import AuthScreen from './components/AuthScreen.jsx'
import NavBar from './components/NavBar.jsx'
import TodayView from './components/TodayView.jsx'
import HistoryView from './components/HistoryView.jsx'
import ValuesView from './components/ValuesView.jsx'
import ChatFab from './components/ChatFab.jsx'
import NexaLoader from './components/NexaLoader.jsx'
import LearnView from './components/LearnView.jsx'
import ContinuousLearningView from './components/ContinuousLearningView.jsx'
import AboutView from './components/AboutView.jsx'

export default function App() {
  const { session, user, loading: authLoading, signIn, signOut } = useAuth()

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <NexaLoader size={40} />
      </div>
    )
  }

  if (!session) {
    return <AuthScreen onSignIn={signIn} />
  }

  return <AuthenticatedApp user={user} onSignOut={signOut} />
}

function AuthenticatedApp({ user, onSignOut }) {
  const {
    data, todayKey, dayFor, loading, error,
    toggleItem, setNote,
    addValue, addValorItem, addRotinaItem, removeChecklistItem,
    updateItemText, moveItem,
    progressForValue, exportJSON, importJSON
  } = useAppData(user.id)

  const [tab, setTab] = useState('hoje')

  if (loading || !data) {
    return (
      <div className="app-loading-screen">
        <NexaLoader size={40} />
      </div>
    )
  }

  const today = dayFor(todayKey)

  return (
    <div className="app-shell">
      <NavBar active={tab} onChange={setTab} />

      <div className="app">
        {error && <p className="sync-error">Aviso: houve um problema ao sincronizar ({error}). Seus dados continuam na tela, tenta recarregar em instantes.</p>}

        {tab === 'hoje' && (
          <TodayView
            data={data}
            dayFor={dayFor}
            progressForValue={progressForValue}
            toggleItem={toggleItem}
            setNote={setNote}
            addValorItem={addValorItem}
            addRotinaItem={addRotinaItem}
            removeChecklistItem={removeChecklistItem}
            updateItemText={updateItemText}
            moveItem={moveItem}
          />
        )}

        {tab === 'historico' && <HistoryView data={data} />}

        {tab === 'valores' && (
          <ValuesView
            data={data}
            todayCompletions={today.completions}
            addValue={addValue}
            addValorItem={addValorItem}
            toggleToday={(itemId) => toggleItem(itemId, todayKey)}
            removeChecklistItem={removeChecklistItem}
          />
        )}

        {tab === 'aprenda' && <LearnView />}
        {tab === 'aprendizado' && <ContinuousLearningView />}
        {tab === 'sobre' && <AboutView />}

        <div className="toolbar">
          <button onClick={exportJSON}>Exportar JSON</button>
          <label>
            Importar JSON
            <input type="file" accept="application/json" onChange={e => e.target.files[0] && importJSON(e.target.files[0])} />
          </label>
          <button onClick={onSignOut}>Sair</button>
        </div>
      </div>

      <ChatFab
        data={data}
        todayKey={todayKey}
        todayWeekday={new Date().getDay()}
        todayCompletions={today.completions}
        userId={user.id}
        onToggle={toggleItem}
        onCreateValue={addValue}
        onAddValorItem={addValorItem}
        onAddRotinaItem={addRotinaItem}
        onEditItem={updateItemText}
        onRemoveItem={removeChecklistItem}
      />
    </div>
  )
}