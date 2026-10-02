import { CalendarDays, Check, Clock3, MoreVertical } from "lucide-react";

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

export default function TodayTaskCard({ task, group }) {
  return (
    <article className={`today-task task-${group}`}>
      <div className="task-heading">
        <span className="task-check" aria-hidden="true">
          {task.status === "done" && <Check size={14} />}
        </span>
        <strong>{task.name}</strong>
        <button
          className="task-menu"
          type="button"
          aria-label={`Opciones de ${task.name}`}
        >
          <MoreVertical size={17} />
        </button>
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
        <span>{formatShortDate(task.due_date)}</span>
      </div>
    </article>
  );
}
