import { createPortal } from "react-dom";
import { CircleAlert } from "lucide-react";

const formatDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const formatHours = (value) =>
  Number(value).toLocaleString("es-CO", { maximumFractionDigits: 1 });

export default function DailyLimitConflictModal({
  limit,
  overloadedDays,
  onAccept,
}) {
  return createPortal(
    <div className="modal-backdrop">
      <section
        className="modal-card daily-limit-conflict-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="daily-limit-conflict-title"
      >
        <CircleAlert className="daily-limit-conflict-icon" size={30} />
        <h2 id="daily-limit-conflict-title">El límite se guardó con conflictos</h2>
        <p>
          El nuevo límite es de <strong>{formatHours(limit)} h por día</strong>.
          Estos días ya tienen más horas asignadas:
        </p>
        <ul className="daily-limit-conflict-list">
          {overloadedDays.map((day) => (
            <li key={day.date}>
              <strong>{formatDate(day.date)}</strong>
              <span>
                {formatHours(day.total_hours)} h planificadas; exceden el límite
                por {formatHours(day.excess_hours)} h.
              </span>
              {day.subtasks?.length > 0 && (
                <span className="daily-limit-conflict-tasks">
                  Gestiones: {day.subtasks.map((task) => task.name).join(", ")}.
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="daily-limit-conflict-note">
          El límite quedó actualizado. Revisa esos días y reprograma las
          gestiones si necesitas resolver la sobrecarga.
        </p>
        <button className="button button-primary" onClick={onAccept}>
          Entendido
        </button>
      </section>
    </div>,
    document.body,
  );
}
