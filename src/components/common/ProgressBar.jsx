import { AlertCircle } from "lucide-react";

//Component that displays a progress bar with optional error state and size

export default function ProgressBar({
  value = 0,
  error = false,
  large = false,
  showCount = false,
  completed = 0,
  total = 0,
}) {
  return (
    <div className={`progress-block ${large ? "progress-block-large" : ""}`}>
      <div className="progress-label">
        <span>
          {showCount
            ? `Progreso del evento: ${completed}/${total} gestiones completadas`
            : "Progreso del evento"}
        </span>
        <strong>{error ? "!" : `${value}%`}</strong>
      </div>
      {error ? (
        <div className="progress-error">
          <AlertCircle size={16} /> No se pudo cargar el progreso de las
          subtareas
        </div>
      ) : (
        <div className="progress-track">
          <span
            className={`progress-fill progress-${value === 100 ? "done" : value ? "active" : "empty"}`}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
    </div>
  );
}
