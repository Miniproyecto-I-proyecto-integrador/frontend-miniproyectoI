import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventServices, getDailyLimit } from "../../api/eventServices";
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
  ActionErrorModal,
  OverloadConflictModal,
  ReduceHoursModal,
  RescheduleModal,
} from "../../components/hoy/ReprogramModals";
import {
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

const sectionEmptyMessages = {
  vencidas: "No tienes gestiones vencidas.",
  hoy: "No tienes gestiones para hoy.",
  proximas: "No hay gestiones próximas.",
};

export default function HoyPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dailyLimit, setDailyLimit] = useState(null);
  const [dailyLimitError, setDailyLimitError] = useState(false);

  // Estado general para modales: edit | delete | reschedule | overload | reduceHours | error
  const [modal, setModal] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState(null);

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

  const today = getToday();
  const refreshDailyLimit = useCallback(async () => {
    try {
      const data = await getDailyLimit(today);
      const limit = Number(data?.daily_hours_limit);
      if (!Number.isFinite(limit)) {
        throw new Error("La respuesta no contiene un límite diario válido");
      }
      setDailyLimit(limit);
      setDailyLimitError(false);
    } catch {
      setDailyLimit(null);
      setDailyLimitError(true);
    }
  }, [today]);

  useEffect(() => {
    void refreshDailyLimit();
    window.addEventListener("daily-limit-updated", refreshDailyLimit);
    return () =>
      window.removeEventListener("daily-limit-updated", refreshDailyLimit);
  }, [refreshDailyLimit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  const allTasks = useMemo(() => flattenTasks(events), [events]);

  const todayHours = useMemo(
    () => sumHours(groupTasks(allTasks, today).hoy),
    [allTasks, today],
  );

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

  const saveEdit = async (payload) => {
    await eventServices.updateSubtask(modal.task.id, payload);
    setModal(null);
    setSuccess({
      title: "¡Subtarea actualizada!",
      message: "Los cambios de la subtarea se guardaron con éxito",
    });
    await load(true);
  };

  const showOverload = (task, targetDate, conflict) => {
    setModal({ type: "overload", task, targetDate, conflict });
  };

  const showRescheduleError = (error) => {
    setModal({
      type: "error",
      title: "Error al actualizar",
      message:
        error?.message || "Ha ocurrido un error al intentar reprogramar la subtarea",
    });
  };

  const handleSelectDate = async (targetDate) => {
    const { task, resolution } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      if (resolution === "move") {
        const result = await eventServices.moveSubtask(
          task.id,
          targetDate,
          today,
        );
        if (!result.conflict_resolved) {
          showOverload(task, targetDate, result.conflict);
          return;
        }
      } else {
        await eventServices.rescheduleSubtask(task.id, targetDate);
      }

      setSuccess({
        title: "Gestión reprogramada",
        message: "La fecha de la subtarea se actualizó correctamente.",
      });
      await load(true);
    } catch (error) {
      if (error?.fields?.conflict) {
        showOverload(task, targetDate, error.fields.conflict);
      } else {
        showRescheduleError(error);
      }
    } finally {
      setBusyId(null);
    }
  };

  const openMoveDatePicker = async () => {
    const { task } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      const result = await eventServices.suggestSubtaskDay(task.id, today);
      setModal({
        type: "reschedule",
        resolution: "move",
        task,
        suggestion: result?.suggestion || null,
        suggestionMessage: result?.suggestion
          ? ""
          : result?.message ||
            "No encontramos un día con capacidad suficiente antes de la fecha del evento.",
      });
    } catch (error) {
      showRescheduleError(error);
    } finally {
      setBusyId(null);
    }
  };

  const reduceHoursAndReschedule = async (newHours) => {
    const { task, targetDate } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      const result = await eventServices.reduceSubtaskHours(
        task.id,
        Number(newHours),
        today,
      );
      if (!result.conflict_resolved) {
        showOverload(task, targetDate, result.conflict);
        return;
      }

      await eventServices.rescheduleSubtask(task.id, targetDate);
      setSuccess({
        title: "Gestión reprogramada",
        message:
          "Se actualizaron las horas estimadas y la fecha de la subtarea.",
      });
      await load(true);
    } catch (error) {
      if (error?.fields?.conflict) {
        showOverload(task, targetDate, error.fields.conflict);
      } else {
        showRescheduleError(error);
      }
    } finally {
      setBusyId(null);
    }
  };

  const header = (showLoad) => (
    <header className="page-header">
      <div>
        <h1>Hoy - Panel de prioridades</h1>
        <p>Organiza las gestiones importantes de tus eventos.</p>
      </div>
      {showLoad && (
        <span
          className={`daily-load ${dailyLimit !== null && todayHours > dailyLimit ? "over" : ""}`}
          title={
            dailyLimitError
              ? "No pudimos consultar el límite diario"
              : undefined
          }
        >
          Carga de hoy: {Number(todayHours.toFixed(1))}h /{" "}
          {dailyLimit === null ? "—" : `${dailyLimit}h`}
        </span>
      )}
    </header>
  );

  if (status === "loading") {
    return (
      <div className="page">
        {header(true)}
        <div className="center-state">
          <div className="loading-message">
            <LoadingSpinner label="Cargando tus eventos" />
            <p>Cargando tus eventos...</p>
          </div>
        </div>
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
      <div className="today-controls">
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
      </div>

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
                      onReschedule={(item) =>
                        setModal({ type: "reschedule", task: item })
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

      {/* Renderizado Condicional de Modales */}
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

      {modal?.type === "reschedule" && (
        <RescheduleModal
          task={modal.task}
          initialDate={modal.suggestion?.date || ""}
          suggestion={modal.suggestion}
          suggestionMessage={modal.suggestionMessage}
          onClose={() => setModal(null)}
          onConfirm={handleSelectDate}
        />
      )}

      {modal?.type === "overload" && (
        <OverloadConflictModal
          conflict={modal.conflict}
          onCancel={() => setModal(null)}
          onReduceHours={() =>
            setModal({
              type: "reduceHours",
              task: modal.task,
              targetDate: modal.targetDate,
              conflict: modal.conflict,
            })
          }
          onMoveOtherDay={openMoveDatePicker}
        />
      )}

      {modal?.type === "reduceHours" && (
        <ReduceHoursModal
          task={modal.task}
          conflict={modal.conflict}
          onClose={() => setModal(null)}
          onConfirm={reduceHoursAndReschedule}
        />
      )}

      {modal?.type === "error" && (
        <ActionErrorModal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(null)}
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