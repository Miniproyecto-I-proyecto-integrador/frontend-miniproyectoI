export default function SuccessModal({ title, message, onAccept }) {
  return <div className="modal-backdrop"><section className="modal success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title"><div className="success-mark">✓</div><h2 id="success-title">{title}</h2><p>{message}</p><button className="button button-primary" onClick={onAccept}>Aceptar</button></section></div>
}
