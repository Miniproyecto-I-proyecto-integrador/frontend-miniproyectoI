export default function SuccessModal({
  title,
  message,
  onAccept,
  actionLabel = "Aceptar",
}) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        <div className="success-mark">✓</div>
        <h2 id="success-title">{title}</h2>
        <p>{message}</p>
        <button className="button button-primary" onClick={onAccept}>
          {actionLabel}
        </button>
      </section>
    </div>
  );
}
