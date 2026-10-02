// Lógica de la vista "Hoy" (US-04): funciones puras, sin React, fáciles de probar.

// Límite diario por defecto (US-12 lo volverá configurable)
export const DAILY_LIMIT_HOURS = 6;

// Fecha de HOY en hora LOCAL (YYYY-MM-DD). Evita el desfase de toISOString(), que usa UTC.
export const getToday = (now = new Date()) => {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// Grupo de una subtarea. Las completadas nunca cuentan como vencidas, van aparte.
export const getGroup = (task, today) => {
  if (task.status === "done") return "completadas";
  if (!task.due_date) return "proximas"; // sin fecha: no es urgente
  if (task.due_date < today) return "vencidas";
  if (task.due_date === today) return "hoy";
  return "proximas";
};

// Convierte los eventos en una lista plana de subtareas, guardando de qué evento vienen
export const flattenTasks = (events) =>
  events.flatMap((event) =>
    (event.subtasks || []).map((task) => ({
      ...task,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date_event,
    })),
  );

const NO_DATE = "9999-12-31";
const hours = (task) => Number(task.estimated_hours) || 0;

// Regla de orden: fecha más cercana/antigua primero → empate: menor esfuerzo → id (estable)
const byPriority = (a, b) =>
  (a.due_date || NO_DATE).localeCompare(b.due_date || NO_DATE) ||
  hours(a) - hours(b) ||
  String(a.id).localeCompare(String(b.id));

// Devuelve { vencidas, hoy, proximas, completadas }, cada una ya ordenada
export const groupTasks = (tasks, today) => {
  const groups = { vencidas: [], hoy: [], proximas: [], completadas: [] };
  tasks.forEach((task) => groups[getGroup(task, today)].push(task));
  groups.vencidas.sort(byPriority); // las más antiguas arriba
  groups.hoy.sort(byPriority); // misma fecha → menor esfuerzo primero
  groups.proximas.sort(byPriority); // la fecha más cercana arriba
  groups.completadas.sort((a, b) => byPriority(b, a)); // las más recientes arriba
  return groups;
};

export const sumHours = (tasks) =>
  tasks.reduce((total, task) => total + hours(task), 0);

// Payload completo para el PUT de una subtarea (el backend recibe el objeto completo)
export const toSubtaskPayload = (task, changes = {}) => ({
  name: task.name,
  category: task.category,
  contact: task.contact,
  description: task.description,
  due_date: task.due_date,
  scheduled_date: task.scheduled_date,
  estimated_hours: Number(task.estimated_hours),
  status: task.status,
  activity: task.eventId,
  ...changes,
});
