import {
  Calendar,
  Clock,
  Pencil,
  Undo2,
  Trash2,
} from "lucide-react";

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
  onToggleDone,
  onReschedule,
  busy = false,
  showStatus = true,
}) {
  const done = task.status === "done";

  return (
    <article
      className={`subtask-row ${done ? "subtask-row-done" : ""} ${busy ? "task-busy" : ""}`}
    >
      <div className="subtask-top">
        <div className="subtask-title">
          <h3>{task.name}</h3>
          {task.category && <span className="badge">{task.category}</span>}
        </div>
        <div className="subtask-top-actions">
          {showStatus && (
            <span className={`status-button status-${task.status}`}>
              {statusLabels[task.status] || task.status}
            </span>
          )}
        </div>
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
        <div className="subtask-actions-footer">
          {done && onToggleDone && (
            <div className="subtask-execution-actions subtask-undo-action">
              <button
                type="button"
                className="task-action-btn task-action-undo"
                disabled={busy}
                onClick={() => onToggleDone(task)}
              >
                <Undo2 size={15} />
                <span>Deshacer</span>
              </button>
            </div>
          )}
          {!done && (onToggleDone || onReschedule) && (
            <div className="subtask-execution-actions">
              {onToggleDone && (
                <button
                  type="button"
                  className="task-action-btn task-action-done"
                  disabled={busy}
                  onClick={() => onToggleDone(task)}
                >
                  <span>Marcar hecha</span>
                </button>
              )}
              {onReschedule && (
                <button
                  type="button"
                  className="task-action-btn task-action-postpone"
                  disabled={busy}
                  onClick={() => onReschedule(task)}
                >
                  <span>Posponer</span>
                </button>
              )}
            </div>
          )}
          <div className="row-actions">
            <button
              type="button"
              className="text-button edit"
              disabled={busy}
              onClick={() => onEdit(task)}
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              type="button"
              className="text-button delete"
              disabled={busy}
              onClick={() => onDelete(task)}
            >
              <Trash2 size={14} /> Borrar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
