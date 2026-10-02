import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventServices } from "../../api/eventServices";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import FilterBar from "../../components/hoy/FilterBar";
import PriorityBanner from "../../components/hoy/PriorityBanner";
import TaskSummary from "../../components/hoy/TaskSummary";
import TodayTaskCard from "../../components/hoy/TodayTaskCard";

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getGroup = (task, currentDate) =>
  task.due_date < currentDate
    ? "vencidas"
    : task.due_date === currentDate
      ? "hoy"
      : "proximas";

const groupOrder = {
  vencidas: 0,
  hoy: 1,
  proximas: 2,
};

const formatTodayTitle = () => {
  const [year, month, day] = getToday().split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `Hoy, ${formatted}`;
};

export default function HoyPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await eventServices.listEvents();
      setEvents(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  const today = getToday();

  const tasks = useMemo(
    () =>
      events
        .flatMap((event) =>
          (event.subtasks || []).map((task) => ({
            ...task,
            eventName: event.name,
          })),
        )
        .filter(
          (task) =>
            eventFilter === "all" ||
            String(task.activity) === String(eventFilter),
        )
        .filter((task) => {
          if (statusFilter === "done") return task.status === "done";
          if (statusFilter === "pending") return task.status !== "done";
          return true;
        })
        .sort((a, b) => {
          const groupA = getGroup(a, today);
          const groupB = getGroup(b, today);

          if (groupOrder[groupA] !== groupOrder[groupB]) {
            return groupOrder[groupA] - groupOrder[groupB];
          }

          if (a.due_date !== b.due_date) {
            return a.due_date.localeCompare(b.due_date);
          }

          return (
            Number(a.estimated_hours || 0) - Number(b.estimated_hours || 0)
          );
        }),
    [events, eventFilter, statusFilter, today],
  );

  const todayCount = tasks.filter(
    (task) => getGroup(task, today) === "hoy",
  ).length;

  if (status === "loading") {
    return (
      <div className="center-state">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Hoy - Panel de prioridades</h1>
            <p>Organiza las gestiones importantes de tus eventos.</p>
          </div>
          <span className="daily-load">Carga diaria: 4h / 6h</span>
        </header>

        <div className="today-state">
          <ErrorState
            title="No pudimos cargar tus gestiones logísticas"
            message="Ocurrió un problema al cargar tus tareas del día de hoy. Verifica tu conexión e intente de nuevo."
            onRetry={load}
            action="Reintentar"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Hoy - Panel de prioridades</h1>
          <p>Organiza las gestiones importantes de tus eventos.</p>
        </div>
        <span className="daily-load">Carga diaria: 4h / 6h</span>
      </header>

      <PriorityBanner />

      <FilterBar
        events={events}
        eventFilter={eventFilter}
        statusFilter={statusFilter}
        onEventChange={setEventFilter}
        onStatusChange={setStatusFilter}
      />

      <TaskSummary
        total={tasks.length}
        todayCount={todayCount}
        statusFilter={statusFilter}
      />

      {!tasks.length ? (
        <div className="today-state">
          <EmptyState
            title="No tienes gestiones pendientes para hoy"
            message="Crea un evento y agrega sus tareas logísticas para verlas aquí organizadas por prioridad."
            action="Crear evento"
            onAction={() => navigate("/crear")}
          />
        </div>
      ) : (
        <div className="priority-groups">
          {["vencidas", "hoy", "proximas"].map((section) => {
            const list = tasks.filter(
              (task) => getGroup(task, today) === section,
            );

            if (!list.length) return null;

            return (
              <section className="priority-section" key={section}>
                <h2>
                  {section === "vencidas"
                    ? "Gestiones vencidas"
                    : section === "hoy"
                      ? formatTodayTitle()
                      : "Próximas"}
                </h2>
                <div className="task-grid">
                  {list.map((task) => (
                    <TodayTaskCard key={task.id} task={task} group={section} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
