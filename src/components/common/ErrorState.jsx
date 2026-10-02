//Component that displays an error state message with an optional retry button

export default function ErrorState({
  title,
  message,
  onRetry,
  action = "Reintentar",
}) {
  return (
    <div className="error-state">
      <div className="error-icon">!</div>
      {title && <h2 className="state-title">{title}</h2>}
      <p>{message}</p>

      {onRetry && (
        <button className="button button-neutral" onClick={onRetry}>
          {action}
        </button>
      )}
    </div>
  );
}
