import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

const formatShortDate = (dateString) => {
  if (!dateString) return "Sin fecha";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(/\.$/, "");
};

// Tarjeta de una gestión. El menú de tres puntos avisa a la página qué quiere hacer el usuario
// (la página es la que habla con la API): ver evento, completar/reabrir, editar o eliminar.
export default function TodayTaskCard({
  task,
  group,
  busy = false,
  onView,
  onToggleDone,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const done = task.status === "done";

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

  return (
    <article className={`today-task task-${group} ${busy ? "task-busy" : ""}`}>
      <div className="task-heading">
        <button
          type="button"
          className={`task-check ${done ? "checked" : ""}`}
          aria-label={
            done
              ? `Marcar como pendiente: ${task.name}`
              : `Marcar como completada: ${task.name}`
          }
          aria-pressed={done}
          disabled={busy}
          onClick={() => onToggleDone(task)}
        >
          {done && <Check size={14} />}
        </button>
        <strong>{task.name}</strong>

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
            <MoreVertical size={17} />
          </button>

          {open && (
            <div className="task-menu-list" role="menu">
              <button type="button" role="menuitem" onClick={choose(onView)}>
                <Eye size={16} /> Ver evento
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={choose(onToggleDone)}
              >
                {done ? (
                  <>
                    <RotateCcw size={16} /> Marcar como pendiente
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Marcar como completada
                  </>
                )}
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

      <div className="today-task-event">
        <CalendarDays size={18} />
        <span>{task.eventName}</span>
      </div>

      <div className="today-task-meta">
        <span>
          <Clock3 size={18} />
          {task.estimated_hours}h
        </span>
        <span>
          {group === "hoy" ? "hoy, " : ""}
          {formatShortDate(task.due_date)}
        </span>
      </div>
    </article>
  );
}
