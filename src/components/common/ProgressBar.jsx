import { AlertCircle } from 'lucide-react'

export default function ProgressBar({ value = 0, error = false, large = false }) {
  return (
    <div className={`progress-block ${large ? 'progress-block-large' : ''}`}>
      <div className="progress-label"><span>Progreso del evento</span><strong>{error ? '!' : `${value}%`}</strong></div>
      {error ? <div className="progress-error"><AlertCircle size={16} /> No se pudo cargar el progreso de las subtareas</div> : <div className="progress-track"><span className={`progress-fill progress-${value === 100 ? 'done' : value ? 'active' : 'empty'}`} style={{ width: `${value}%` }} /></div>}
    </div>
  )
}
