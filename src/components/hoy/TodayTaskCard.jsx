import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Eye,
  MessageSquare,
  MoreVertical,
  Pencil,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react";

const formatShortDate = (dateString) => {
  if (!dateString) return "Sin fecha";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = new Intl.DateTimeFormat("es-CO", {
    month: "short",
  })
    .format(date)
    .replace(/\.$/, "")
    .toLowerCase();

  return `${day} de ${monthName}`;
};

const getDueDateLabel = (task, group, done) => {
  if (done) {
    return task.due_date ? `Hecha · ${formatShortDate(task.due_date)}` : "Hecha";
  }
  if (!task.due_date) return "Sin fecha";
  if (group === "vencidas") return `Venció el ${formatShortDate(task.due_date)}`;
  if (group === "hoy") return "Para hoy";
  return `Para el ${formatShortDate(task.due_date)}`;
};

export default function TodayTaskCard({
  task,
  group,
  busy = false,
  onView,
  onToggleDone,
  onEdit,
  onDelete,
  onReschedule,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const done = task.status === "done";
  const postponed = task.status === "postponed";
  const hasNote = Boolean(task.note?.trim());

  // Cierra el menú al hacer clic fuera o al pulsar Escape
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (action) => () => {
    setOpen(false);
    action(task);
  };

  const formattedHours = Number(task.estimated_hours || 0).toFixed(1);

  return (
    <article className={`today-task task-${group} ${busy ? "task-busy" : ""}`}>
      <div className="task-heading">
        {done && (
          <span className="task-done-badge-icon" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        <strong>{task.name}</strong>

        {done ? (
          <span className="task-status-pill pill-done">Hecha</span>
        ) : (
          <div className="task-heading-right">
            {postponed && (
              <span className="task-status-pill pill-postponed">Pospuesta</span>
            )}

            <div className="task-menu-wrap" ref={menuRef}>
              <button
                className="task-menu"
                type="button"
                aria-label={`Opciones de ${task.name}`}
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={busy}
                onClick={() => setOpen((current) => !current)}
              >
                <MoreVertical size={18} />
              </button>

              {open && (
                <div className="task-menu-list" role="menu">
                  <button type="button" role="menuitem" onClick={choose(onView)}>
                    <Eye size={16} /> Ver evento
                  </button>
                  <button type="button" role="menuitem" onClick={choose(onEdit)}>
                    <Pencil size={16} /> Editar gestión
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="danger"
                    onClick={choose(onDelete)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="today-task-event">
        <CalendarDays size={18} />
        <span>{task.eventName}</span>
      </div>

      <div className="today-task-meta">
        <span>
          <Clock3 size={18} />
          {formattedHours}h
        </span>
        <span className="today-task-due-date">
          {getDueDateLabel(task, group, done)}
        </span>
      </div>

      {!done && hasNote && (
        <div className="today-task-note">
          <MessageSquare size={16} className="today-task-note-icon" />
          <div className="today-task-note-body">
            <span className="today-task-note-label">Nota</span>
            <p className="today-task-note-text">{task.note.trim()}</p>
            {onReschedule && (
              <button
                type="button"
                className="today-task-note-edit"
                disabled={busy}
                onClick={() => onReschedule(task)}
              >
                Editar nota
              </button>
            )}
          </div>
        </div>
      )}

      {done ? (
        <div className="today-task-actions today-task-actions-single">
          <button
            type="button"
            className="task-action-btn task-action-undo"
            disabled={busy}
            onClick={() => onToggleDone(task)}
          >
            <Undo2 size={17} strokeWidth={2.2} />
            <span>Deshacer</span>
          </button>
        </div>
      ) : (
        <div className="today-task-actions">
          <button
            type="button"
            className="task-action-btn task-action-done"
            disabled={busy}
            onClick={() => onToggleDone(task)}
          >
            <Check size={17} strokeWidth={2.5} />
            <span>Marcar hecha</span>
          </button>

          <button
            type="button"
            className="task-action-btn task-action-postpone"
            disabled={busy || !onReschedule}
            onClick={() => onReschedule?.(task)}
          >
            <RotateCw size={17} />
            <span>Posponer</span>
          </button>
        </div>
      )}
    </article>
  );
}
