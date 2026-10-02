import { AlertCircle } from "lucide-react";

export default function TaskSummary({ total, todayCount, statusFilter }) {
  const label =
    statusFilter === "pending"
      ? "pendientes"
      : statusFilter === "done"
        ? "completadas"
        : "";
  const taskWord = total === 1 ? "tarea" : "tareas";

  return (
    <div className="task-summary">
      <AlertCircle size={18} />
      <span>
        {total} {taskWord}
        {label ? ` ${label}` : ""} - {todayCount} para hoy
      </span>
    </div>
  );
}
