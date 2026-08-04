import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Registra o service worker assim que a página carrega — precisa estar
// registrado mesmo antes do usuário clicar em "Ativar lembretes", senão
// o navegador/iOS não reconhece o app como instalável.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Falha ao registrar o service worker:', err)
    })
  })
}