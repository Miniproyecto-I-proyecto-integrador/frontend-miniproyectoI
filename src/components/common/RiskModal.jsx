export default function RiskModal({ title, message, onConfirm, onCancel }) {
  return <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="risk-title"><h2 id="risk-title">{title}</h2><p>{message}</p><div className="modal-actions"><button className="button button-neutral" onClick={onCancel}>Cancelar</button><button className="button button-danger" onClick={onConfirm}>Eliminar</button></div></section></div>
}
