export default function ErrorState({ message, onRetry, action = 'Reintentar' }) {
  return <div className="error-state"><div className="error-icon">!</div><p>{message}</p>{onRetry && <button className="button button-neutral" onClick={onRetry}>{action}</button>}</div>
}
