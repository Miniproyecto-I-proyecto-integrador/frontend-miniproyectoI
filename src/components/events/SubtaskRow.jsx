import { Calendar, ChevronDown, Clock, Pencil, Trash2 } from "lucide-react";

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En curso",
  postponed: "Pospuesta",
  done: "Terminada",
};

export default function SubtaskRow({
  task,
  onEdit,
  onDelete,
  showStatus = true,
}) {
  return (
    <article className="subtask-row">
      <div className="subtask-top">
        <div className="subtask-title">
          <h3>{task.name}</h3>
          {task.category && <span className="badge">{task.category}</span>}
        </div>
        {/* Provisional: todavía no cambia el estado */}
        {showStatus && (
          <button
            type="button"
            className={`status-button status-${task.status}`}
            aria-label="Cambiar estado de la subtarea"
          >
            {statusLabels[task.status] || task.status} <ChevronDown size={14} />
          </button>
        )}
      </div>

      <div className="subtask-body">
        <div className="subtask-details">
          <span>
            <Calendar size={15} /> plazo límite: <b>{task.due_date}</b>
          </span>
          <span>
            <Clock size={15} /> horas estimadas: <b>{task.estimated_hours}h</b>
          </span>
          {task.description?.trim() && (
            <span>
              descripción: <b>{task.description}</b>
            </span>
          )}
        </div>

        <div className="row-actions">
          <button
            type="button"
            className="text-button edit"
            onClick={() => onEdit(task)}
          >
            <Pencil size={14} /> editar
          </button>
          <button
            type="button"
            className="text-button delete"
            onClick={() => onDelete(task)}
          >
            <Trash2 size={14} /> borrar
          </button>
        </div>
      </div>
    </article>
  );
}
