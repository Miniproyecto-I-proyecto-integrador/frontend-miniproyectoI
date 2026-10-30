import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eventServices } from "../../api/eventServices";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ProgressBar from "../../components/common/ProgressBar";
import RiskModal from "../../components/common/RiskModal";
import SubtaskModal from "../../components/events/SubtaskModal";
import SubtaskRow from "../../components/events/SubtaskRow";
import EventEditModal from "../../components/events/EventEditModal";
import SuccessModal from "../../components/common/SuccessModal";
import {
  ActionErrorModal,
  OverloadConflictModal,
  ReduceHoursModal,
  RescheduleModal,
} from "../../components/hoy/ReprogramModals";
import { getToday } from "../../utils/hoy";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = getToday();
  const [success, setSuccess] = useState(null);
  const [event, setEvent] = useState(null);
  const [state, setState] = useState("loading");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState("loading");
      try {
        setEvent(await eventServices.getEvent(id));
        setState("ready");
      } catch (err) {
        // 404 (no existe) o 403 (es de otro organizador) → "no encontrado"; cualquier otro fallo → error con reintento
        setState([403, 404].includes(err.status) ? "missing" : "error");
      }
    },
    [id],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const saveEvent = async (payload) => {
    const updated = await eventServices.updateActividad(id, payload);
    setEvent((current) => ({ ...current, ...updated }));
    setModal(null);
    setSuccess({
      title: "¡Evento actualizado!",
      message: "Los cambios del evento se guardaron con éxito",
    });
  };
  const saveTask = async (payload) => {
    const editing = Boolean(modal?.task);
    if (modal?.task) await eventServices.updateSubtask(modal.task.id, payload);
    else await eventServices.createSubtask(payload);
    setModal(null);
    setSuccess(
      editing
        ? {
            title: "¡Subtarea actualizada!",
            message: "Los cambios de la subtarea se guardaron con éxito",
            redirect: false,
          }
        : {
            title: "¡Subtarea creada!",
            message: "La subtarea ha sido creada con éxito",
            redirect: false,
          },
    );
    await load(true);
  };
  const removeTask = async () => {
    try {
      await eventServices.deleteSubtask(modal.task.id);
      setModal(null);
      setSuccess({
        title: "¡Subtarea eliminada!",
        message: "La subtarea ha sido eliminada con éxito",
        redirect: false,
      });
      await load();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };
  const removeEvent = async () => {
    try {
      await eventServices.deleteEvent(id);
      setModal(null);
      setSuccess({
        title: "¡Evento eliminado!",
        message: "El evento ha sido eliminado con éxito",
        redirect: true,
      });
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const notifyTasksUpdated = () => {
    window.dispatchEvent(new Event("tasks-updated"));
  };

  const showActionError = (actionError) => {
    setModal({
      type: "action-error",
      title: "Error al actualizar",
      message:
        actionError?.message ||
        "Ha ocurrido un error al intentar actualizar la subtarea",
    });
  };

  const showOverload = (task, targetDate, conflict, note = "", mode) => {
    setModal({ type: "overload", task, targetDate, conflict, note, mode });
  };

  const taskWithEvent = (task) => ({
    ...task,
    eventName: event.name,
    eventDate: event.date_event,
  });

  const toggleTaskDone = async (task) => {
    setBusyId(task.id);
    try {
      if (task.status === "done") {
        await eventServices.patchSubtask(task.id, { status: "pending" });
      } else {
        await eventServices.registerExecution(task.id, { status: "done" });
      }
      await load(true);
      notifyTasksUpdated();
      if (task.status !== "done") {
        setSuccess({
          title: "Gestión completada",
          message: "La subtarea se marcó como hecha correctamente.",
          redirect: false,
        });
      }
    } catch (actionError) {
      if (actionError?.fields?.conflict) {
        showOverload(
          taskWithEvent(task),
          task.scheduled_date,
          actionError.fields.conflict,
          "",
          task.status === "done" ? "undo" : undefined,
        );
      } else {
        showActionError(actionError);
      }
    } finally {
      setBusyId(null);
    }
  };

  const openReschedule = (task) => {
    setModal({ type: "reschedule", task: taskWithEvent(task) });
  };

  const handleSelectDate = async (targetDate, note = "") => {
    const { task } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      await eventServices.registerExecution(task.id, {
        status: "postponed",
        note,
        scheduled_date: targetDate,
      });
      await load(true);
      notifyTasksUpdated();
      setSuccess({
        title: "Gestión pospuesta",
        message: "La fecha y la nota de la subtarea se actualizaron correctamente.",
        redirect: false,
      });
    } catch (actionError) {
      if (actionError?.fields?.conflict) {
        showOverload(task, targetDate, actionError.fields.conflict, note);
      } else {
        showActionError(actionError);
      }
    } finally {
      setBusyId(null);
    }
  };

  const openMoveDatePicker = async () => {
    const { task, note } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      const result = await eventServices.suggestSubtaskDay(task.id, today);
      setModal({
        type: "reschedule",
        task,
        note,
        resolution: "move",
        suggestion: result?.suggestion || null,
        suggestionMessage: result?.suggestion
          ? ""
          : result?.message ||
            "No encontramos un día con capacidad suficiente antes de la fecha del evento.",
      });
    } catch (actionError) {
      showActionError(actionError);
    } finally {
      setBusyId(null);
    }
  };

  const confirmReschedule = async (targetDate, note = "") => {
    const { task, resolution } = modal;
    if (resolution !== "move") {
      await handleSelectDate(targetDate, note);
      return;
    }

    setModal(null);
    setBusyId(task.id);
    try {
      const result = await eventServices.moveSubtask(
        task.id,
        targetDate,
        today,
      );
      if (!result.conflict_resolved) {
        showOverload(task, targetDate, result.conflict, note);
        return;
      }
      await eventServices.registerExecution(task.id, {
        status: "postponed",
        note,
        scheduled_date: targetDate,
      });
      await load(true);
      notifyTasksUpdated();
      setSuccess({
        title: "Gestión pospuesta",
        message: "La fecha y la nota de la subtarea se actualizaron correctamente.",
        redirect: false,
      });
    } catch (actionError) {
      if (actionError?.fields?.conflict) {
        showOverload(task, targetDate, actionError.fields.conflict, note);
      } else {
        showActionError(actionError);
      }
    } finally {
      setBusyId(null);
    }
  };

  const reduceHoursAndReschedule = async (newHours) => {
    const { task, targetDate, note } = modal;
    setModal(null);
    setBusyId(task.id);
    try {
      const result = await eventServices.reduceSubtaskHours(
        task.id,
        Number(newHours),
        today,
      );
      if (!result.conflict_resolved) {
        showOverload(task, targetDate, result.conflict, note);
        return;
      }
      await eventServices.registerExecution(task.id, {
        status: "postponed",
        note,
        scheduled_date: targetDate,
      });
      await load(true);
      notifyTasksUpdated();
      setSuccess({
        title: "Gestión pospuesta",
        message: "Se actualizaron las horas estimadas y se pospuso la subtarea.",
        redirect: false,
      });
    } catch (actionError) {
      if (actionError?.fields?.conflict) {
        showOverload(task, targetDate, actionError.fields.conflict, note);
      } else {
        showActionError(actionError);
      }
    } finally {
      setBusyId(null);
    }
  };

  if (state === "loading")
    return (
      <div className="center-state">
        <LoadingSpinner />
      </div>
    );
  if (state === "error")
    return (
      <div className="page">
        <ErrorState
          message="No pudimos cargar el evento, por favor reintenta."
          onRetry={() => load()}
        />
      </div>
    );
  if (state === "missing")
    return (
      <div className="page">
        <ErrorState
          message="No encontramos este evento. Es posible que no exista o que no tengas acceso a él."
          onRetry={() => navigate("/eventos")}
          action="Volver a eventos"
        />
      </div>
    );
  const subtasks = Array.isArray(event.subtasks) ? event.subtasks : [];
  const totalSubtasks = Math.max(
    0,
    Number(event.total_subtasks ?? subtasks.length) || 0,
  );
  const completedSubtasks = Math.min(
    totalSubtasks,
    Math.max(
      0,
      Number(
        event.completed_subtasks ??
          subtasks.filter((task) => task.status === "done").length,
      ) || 0,
    ),
  );
  const progress =
    totalSubtasks === 0
      ? 0
      : Number(
          event.progress ??
            Math.round((completedSubtasks / totalSubtasks) * 100),
        ) || 0;

  const facts = [
    ["Lugar", event.location],
    ["Cliente", event.client],
    ["Descripción", event.description],
  ].filter(([, value]) => value?.trim());

  return (
    <div className="page">
      <header className="detail-header">
        <h1>Detalle del evento</h1>
        <Link to="/eventos">
          <ArrowLeft size={16} /> Volver a eventos
        </Link>
      </header>
      {error && <div className="server-error">{error}</div>}
      <section className="event-detail-card">
        <div className="detail-card-top">
          <div className="detail-title">
            <h2>{event.name}</h2>
            <div className="detail-badges">
              <span className="badge">{event.date_event}</span>
              <span className="badge">{event.event_type || "Evento"}</span>
            </div>
          </div>
          <div className="row-actions">
            <button
              className="text-button edit"
              onClick={() => setModal({ type: "event-edit" })}
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              className="text-button delete"
              onClick={() => setModal({ type: "event-delete" })}
            >
              <Trash2 size={14} /> Borrar
            </button>
          </div>
        </div>

        {facts.length > 0 && (
          <ul className="event-facts">
            {facts.map(([label, value]) => (
              <li key={label}>
                <b>{label}:</b> {value}
              </li>
            ))}
          </ul>
        )}

        <ProgressBar
          value={progress}
          large
          showCount={true}
          completed={completedSubtasks}
          total={totalSubtasks}
        />
      </section>
      <section className="subtasks-section">
        <div className="section-heading">
          <h2>Subtareas logísticas:</h2>
          <button
            className="button button-primary"
            onClick={() => setModal({ type: "task-form" })}
          >
            <Plus size={17} /> Crear subtarea
          </button>
        </div>
        {!event.subtasks?.length && (
          <EmptyState
            message="Este evento aún no tiene subtareas logísticas. Crea una nueva subtarea aquí."
            action="Crear subtarea"
            onAction={() => setModal({ type: "task-form" })}
          />
        )}
        {event.subtasks?.map((task) => (
          <SubtaskRow
            key={task.id}
            task={task}
            busy={busyId === task.id}
            onEdit={(item) => setModal({ type: "task-form", task: item })}
            onDelete={(item) => setModal({ type: "task-delete", task: item })}
            onToggleDone={toggleTaskDone}
            onReschedule={openReschedule}
          />
        ))}
      </section>
      {modal?.type === "event-edit" && (
        <EventEditModal
          event={event}
          onClose={() => setModal(null)}
          onSubmit={saveEvent}
        />
      )}
      {modal?.type === "task-form" && (
        <SubtaskModal
          key={modal.task?.id || "new"}
          activityId={id}
          eventDate={event.date_event}
          task={modal.task}
          onClose={() => setModal(null)}
          onSubmit={saveTask}
        />
      )}
      {modal?.type === "task-delete" && (
        <RiskModal
          title="¿Eliminar esta subtarea?"
          message="Esta acción no se puede deshacer."
          onCancel={() => setModal(null)}
          onConfirm={removeTask}
        />
      )}
      {modal?.type === "event-delete" && (
        <RiskModal
          title="¿Eliminar este evento?"
          message="También se eliminarán sus subtareas logísticas."
          onCancel={() => setModal(null)}
          onConfirm={removeEvent}
        />
      )}
      {modal?.type === "reschedule" && (
        <RescheduleModal
          task={modal.task}
          initialDate={modal.suggestion?.date || ""}
          initialNote={modal.note}
          suggestion={modal.suggestion}
          suggestionMessage={modal.suggestionMessage}
          onClose={() => setModal(null)}
          onConfirm={confirmReschedule}
        />
      )}
      {modal?.type === "overload" && (
        <OverloadConflictModal
          conflict={modal.conflict}
          onCancel={() => setModal(null)}
          cancelLabel={modal.mode === "undo" ? "Entendido" : "Cancelar"}
          onReduceHours={
            modal.mode === "undo"
              ? undefined
              : () =>
                  setModal({
                    type: "reduce-hours",
                    task: modal.task,
                    targetDate: modal.targetDate,
                    conflict: modal.conflict,
                    note: modal.note,
                  })
          }
          onMoveOtherDay={
            modal.mode === "undo" ? undefined : openMoveDatePicker
          }
        />
      )}
      {modal?.type === "reduce-hours" && (
        <ReduceHoursModal
          task={modal.task}
          conflict={modal.conflict}
          onClose={() => setModal(null)}
          onConfirm={reduceHoursAndReschedule}
        />
      )}
      {modal?.type === "action-error" && (
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
          onAccept={() => {
            setSuccess(null);

            if (success.redirect) {
              navigate("/eventos");
            }
          }}
        />
      )}
    </div>
  );
}
