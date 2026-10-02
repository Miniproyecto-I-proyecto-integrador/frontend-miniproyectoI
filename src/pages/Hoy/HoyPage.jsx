import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventServices } from "../../api/eventServices";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import FormError from "../../components/common/FormError";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import RiskModal from "../../components/common/RiskModal";
import SuccessModal from "../../components/common/SuccessModal";
import SubtaskModal from "../../components/events/SubtaskModal";
import FilterBar from "../../components/hoy/FilterBar";
import PriorityBanner from "../../components/hoy/PriorityBanner";
import TaskSummary from "../../components/hoy/TaskSummary";
import TodayTaskCard from "../../components/hoy/TodayTaskCard";
import {
  DAILY_LIMIT_HOURS,
  flattenTasks,
  getToday,
  groupTasks,
  sumHours,
  toSubtaskPayload,
} from "../../utils/hoy";

const formatTodayTitle = (today) => {
  const [year, month, day] = today.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
  return `Hoy, ${formatted}`;
};

const sectionTitles = {
  vencidas: "Gestiones vencidas",
  proximas: "Próximas",
  completadas: "Completadas",
};

// Mensaje pequeño cuando una sección no tiene gestiones
const sectionEmptyMessages = {
  vencidas: "No tienes gestiones vencidas.",
  hoy: "No tienes gestiones para hoy.",
  proximas: "No hay gestiones próximas.",
};

export default function HoyPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | { type: "edit" | "delete", task }
  const [busyId, setBusyId] = useState(null); // gestión con una acción en curso
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState(null);

  // silent = refrescar sin cambiar a la pantalla de carga (se usa después de editar, completar o eliminar)
  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      setEvents(await eventServices.listEvents());
      setStatus("ready");
    } catch {
      if (silent)
        setActionError(
          "No pudimos actualizar la lista, por favor recarga la página",
        );
      else setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  const today = getToday();

  const allTasks = useMemo(() => flattenTasks(events), [events]);

  // Carga de hoy: horas de las gestiones pendientes con fecha de hoy (sin filtros)
  const todayHours = useMemo(
    () => sumHours(groupTasks(allTasks, today).hoy),
    [allTasks, today],
  );

  // Los filtros se aplican antes de agrupar, así la regla de prioridad se mantiene
  const groups = useMemo(
    () =>
      groupTasks(
        allTasks.filter(
          (task) =>
            eventFilter === "all" ||
            String(task.eventId) === String(eventFilter),
        ),
        today,
      ),
    [allTasks, eventFilter, today],
  );

  const clearFilters = () => {
    setEventFilter("all");
    setStatusFilter("all");
  };

  // Ejecuta una acción de la tarjeta (completar / eliminar) y refresca la lista
  const runAction = async (task, action, errorMessage) => {
    setBusyId(task.id);
    setActionError("");
    try {
      await action();
      await load(true);
    } catch {
      setActionError(errorMessage);
    } finally {
      setBusyId(null);
    }
  };

  const toggleDone = (task) =>
    runAction(
      task,
      () =>
        eventServices.updateSubtask(
          task.id,
          toSubtaskPayload(task, {
            status: task.status === "done" ? "pending" : "done",
          }),
        ),
      "No pudimos actualizar la gestión, por favor reintenta",
    );

  const confirmDelete = () => {
    const { task } = modal;
    setModal(null);
    return runAction(
      task,
      () => eventServices.deleteSubtask(task.id),
      "No pudimos eliminar la gestión, por favor reintenta",
    );
  };

  // El SubtaskModal muestra su propio error si esto lanza una excepción
  const saveEdit = async (payload) => {
    await eventServices.updateSubtask(modal.task.id, payload);
    setModal(null);
    setSuccess({
      title: "¡Subtarea actualizada!",
      message: "Los cambios de la subtarea se guardaron con éxito",
    });
    await load(true);
  };

  const header = (showLoad) => (
    <header className="page-header">
      <div>
        <h1>Hoy - Panel de prioridades</h1>
        <p>Organiza las gestiones importantes de tus eventos.</p>
      </div>
      {showLoad && (
        <span
          className={`daily-load ${todayHours > DAILY_LIMIT_HOURS ? "over" : ""}`}
        >
          Carga de hoy: {Number(todayHours.toFixed(1))}h / {DAILY_LIMIT_HOURS}h
        </span>
      )}
    </header>
  );

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
        {header(false)}
        <div className="today-state">
          <ErrorState
            title="No pudimos cargar tus gestiones logísticas"
            message="Ocurrió un problema al cargar tus tareas del día de hoy. Verifica tu conexión e intente de nuevo."
            onRetry={() => load()}
            action="Reintentar"
          />
        </div>
      </div>
    );
  }

  // Sin ninguna gestión: solo el estado vacío con la acción sugerida
  if (!allTasks.length) {
    return (
      <div className="page">
        {header(false)}
        <div className="today-state">
          <EmptyState
            title="No tienes gestiones pendientes para hoy"
            message="Crea un evento y agrega sus tareas logísticas para verlas aquí organizadas por prioridad."
            action="Crear evento"
            onAction={() => navigate("/crear")}
          />
        </div>
      </div>
    );
  }

  const pendingSections = ["vencidas", "hoy", "proximas"];
  const visibleSections =
    statusFilter === "done"
      ? ["completadas"]
      : [
          ...pendingSections,
          ...(statusFilter === "all" && groups.completadas.length
            ? ["completadas"]
            : []),
        ];

  return (
    <div className="page">
      {header(true)}

      <PriorityBanner />

      <FilterBar
        events={events}
        eventFilter={eventFilter}
        statusFilter={statusFilter}
        onEventChange={setEventFilter}
        onStatusChange={setStatusFilter}
        onClear={clearFilters}
      />

      <TaskSummary
        pendingCount={pendingSections.reduce(
          (n, key) => n + groups[key].length,
          0,
        )}
        todayCount={groups.hoy.length}
        doneCount={groups.completadas.length}
        statusFilter={statusFilter}
      />

      {actionError && <FormError message={actionError} />}

      <div className="priority-groups">
        {visibleSections.map((section) => {
          const list = groups[section];
          return (
            <section
              className={`priority-section section-${section}`}
              key={section}
            >
              <h2>
                {section === "hoy"
                  ? formatTodayTitle(today)
                  : sectionTitles[section]}
                <span className="section-count">{list.length}</span>
              </h2>

              {list.length ? (
                <div className="task-grid">
                  {list.map((task) => (
                    <TodayTaskCard
                      key={task.id}
                      task={task}
                      group={section}
                      busy={busyId === task.id}
                      onView={() => navigate(`/evento/${task.eventId}`)}
                      onToggleDone={toggleDone}
                      onEdit={(item) => setModal({ type: "edit", task: item })}
                      onDelete={(item) =>
                        setModal({ type: "delete", task: item })
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="section-empty">{sectionEmptyMessages[section]}</p>
              )}
            </section>
          );
        })}
      </div>

      {modal?.type === "edit" && (
        <SubtaskModal
          key={modal.task.id}
          activityId={modal.task.eventId}
          eventDate={modal.task.eventDate}
          task={toSubtaskPayload(modal.task)}
          onClose={() => setModal(null)}
          onSubmit={saveEdit}
        />
      )}
      {modal?.type === "delete" && (
        <RiskModal
          title="¿Eliminar esta gestión?"
          message={`Se eliminará "${modal.task.name}" de ${modal.task.eventName}. Esta acción no se puede deshacer.`}
          onCancel={() => setModal(null)}
          onConfirm={confirmDelete}
        />
      )}
      {success && (
        <SuccessModal
          title={success.title}
          message={success.message}
          onAccept={() => setSuccess(null)}
        />
      )}
    </div>
  );
}
