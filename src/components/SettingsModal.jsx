// Modal de Configurações — aberto pelo botão de engrenagem na navbar.
// A rotina continua sendo sempre o padrão fixo da tela "Hoje" (não dá pra
// desligar ela); o que a pessoa pode escolher é o que MAIS aparece junto:
// a seção de Valores e o cartão de mapeamento de hábitos.

export default function SettingsModal({ open, settings, onChange, onClose }) {
  if (!open) return null

  const s = settings || { showValues: true, showHabitScorecard: true }

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="whatsnew-head">
          <span className="whatsnew-title">Configurações</span>
          <button className="chat-drawer-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <p className="settings-intro">
          A rotina é sempre o padrão da tela "Hoje". Escolha o que mais você quer ver junto com ela.
        </p>

        <label className="settings-toggle-row">
          <div>
            <span className="settings-toggle-title">Mostrar "Valores"</span>
            <span className="settings-toggle-desc">Seção com os checklists dos seus valores pessoais, na tela "Hoje".</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(s.showValues)}
            onChange={e => onChange({ showValues: e.target.checked })}
          />
        </label>

        <label className="settings-toggle-row">
          <div>
            <span className="settings-toggle-title">Mostrar "Mapeamento de hábitos"</span>
            <span className="settings-toggle-desc">Cartão pra adicionar e classificar hábitos (bons ou ruins), direto na tela "Hoje".</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(s.showHabitScorecard)}
            onChange={e => onChange({ showHabitScorecard: e.target.checked })}
          />
        </label>

        <button className="whatsnew-confirm" onClick={onClose}>Pronto</button>
      </div>
    </div>
  )
}