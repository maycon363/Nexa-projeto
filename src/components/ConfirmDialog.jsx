// Diálogo de confirmação reutilizável, com o visual do app em vez do popup
// feio e genérico do navegador (window.confirm). Pensado especialmente pra
// ações que não têm volta (tipo apagar algo) — por isso o botão de confirmar
// vem destacado em vermelho quando tone="danger", pra distinguir bem do botão
// de cancelar e reduzir clique sem querer.

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel
}) {
  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className={`confirm-icon tone-${tone}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4M12 16.5h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
              stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>
        </div>

        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className={`confirm-btn confirm-btn-${tone}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}