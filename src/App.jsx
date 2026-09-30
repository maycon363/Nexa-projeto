import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useAppData } from './hooks/useAppData.js'
import { resyncPushSubscriptionIfEnabled } from './services/pushService.js'
import AuthScreen from './components/AuthScreen.jsx'
import NavBar from './components/NavBar.jsx'
import IosInstallBanner from './components/IosInstallBanner.jsx'
import TodayView from './components/TodayView.jsx'
import HistoryView from './components/HistoryView.jsx'
import ChatFab from './components/ChatFab.jsx'
import ScrollToTopButton from './components/ScrollToTopButton.jsx'
import NexaLoader from './components/NexaLoader.jsx'
import LearnView from './components/LearnView.jsx'
import ContinuousLearningView from './components/ContinuousLearningView.jsx'
import AboutView from './components/AboutView.jsx'
import Footer from './components/Footer.jsx'
import WhatsNewModal from './components/WhatsNewModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

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
    addValue, removeValue, addValorItem, addRotinaItem, addSubTask, removeChecklistItem,
    updateItemText, updateItemTime, moveItem,
    updateSettings,
    addHabit, removeHabit, classifyHabit,
    progressForValue, exportJSON, importJSON
  } = useAppData(user.id)

  const [tab, setTab] = useState('hoje')
  const [whatsNewSignal, setWhatsNewSignal] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    resyncPushSubscriptionIfEnabled()
  }, [])

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
      <IosInstallBanner />

      <NavBar
        active={tab}
        onChange={setTab}
        onOpenChangelog={() => setWhatsNewSignal(n => n + 1)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="app">
        {error && <p className="sync-error">Aviso: houve um problema ao sincronizar ({error}). Seus dados continuam na tela, tenta recarregar em instantes.</p>}

        {/* "Hoje" agora concentra rotina (sempre fixa), valores (opcional via
            Configurações) e o mapeamento de hábitos (opcional via
            Configurações) — por isso as antigas abas separadas "Valores" e
            "Mapeamento" saíram da navbar. */}
        {tab === 'hoje' && (
          <TodayView
            data={data}
            dayFor={dayFor}
            progressForValue={progressForValue}
            toggleItem={toggleItem}
            setNote={setNote}
            addValorItem={addValorItem}
            addRotinaItem={addRotinaItem}
            addSubTask={addSubTask}
            removeChecklistItem={removeChecklistItem}
            updateItemText={updateItemText}
            updateItemTime={updateItemTime}
            moveItem={moveItem}
            removeValue={removeValue}
            addHabit={addHabit}
            removeHabit={removeHabit}
            classifyHabit={classifyHabit}
          />
        )}

        {tab === 'historico' && <HistoryView data={data} />}

        {tab === 'aprenda' && <LearnView />}
        {tab === 'aprendizado' && <ContinuousLearningView />}
        {tab === 'sobre' && <AboutView />}

        <Footer
          onExport={exportJSON}
          onImport={e => e.target.files[0] && importJSON(e.target.files[0])}
          onSignOut={onSignOut}
        />
      </div>

      <WhatsNewModal userId={user.id} forceOpenSignal={whatsNewSignal} />

      <SettingsModal
        open={settingsOpen}
        settings={data.settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <ScrollToTopButton />
      <ChatFab
        data={data}
        todayKey={todayKey}
        todayWeekday={new Date().getDay()}
        todayCompletions={today.completions}
        userId={user.id}
        activeTab={tab}
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