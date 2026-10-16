import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";

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
        {showStatus && (
          <span className={`status-button status-${task.status}`}>
            {statusLabels[task.status] || task.status}
          </span>
        )}
      </div>

      <div className="subtask-body">
        <div className="subtask-details">
          <span>
            <Calendar size={15} /> Plazo límite: <b>{task.due_date}</b>
          </span>
          <span>
            <Clock size={15} /> Horas estimadas: <b>{task.estimated_hours}h</b>
          </span>
          {task.description?.trim() && (
            <span>
              Descripción: <b>{task.description}</b>
            </span>
          )}
        </div>

        <div className="row-actions">
          <button
            type="button"
            className="text-button edit"
            onClick={() => onEdit(task)}
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            type="button"
            className="text-button delete"
            onClick={() => onDelete(task)}
          >
            <Trash2 size={14} /> Borrar
          </button>
        </div>
      </div>
    </article>
  );
}
