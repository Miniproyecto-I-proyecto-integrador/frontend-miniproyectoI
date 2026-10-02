import { AlertCircle } from "lucide-react";

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

// Resumen: "6 tareas pendientes - 2 para hoy" (con el filtro "Completadas" muestra solo las completadas)
export default function TaskSummary({
  pendingCount,
  todayCount,
  doneCount,
  statusFilter,
}) {
  const text =
    statusFilter === "done"
      ? plural(doneCount, "tarea completada", "tareas completadas")
      : `${plural(pendingCount, "tarea pendiente", "tareas pendientes")} - ${todayCount} para hoy${
          statusFilter === "all" && doneCount
            ? ` - ${plural(doneCount, "completada", "completadas")}`
            : ""
        }`;

  return (
    <div className="task-summary">
      <AlertCircle size={18} />
      <span>{text}</span>
    </div>
  );
}
