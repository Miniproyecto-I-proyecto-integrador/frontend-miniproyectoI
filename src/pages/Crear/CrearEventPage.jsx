import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventServices } from "../../api/eventServices";
import FormError from "../../components/common/FormError";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SuccessModal from "../../components/common/SuccessModal";
import SubtaskModal from "../../components/events/SubtaskModal";
import SubtaskRow from "../../components/events/SubtaskRow";

const initialForm = {
  name: "",
  event_type: "",
  date_event: "",
  location: "",
  client: "",
  description: "",
  user_id: "00000000-0000-0000-0000-000000000001", // se reemplaza en el Sprint 2 con el usuario logueado
};

export default function CrearEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [subtasks, setSubtasks] = useState([]); // subtareas opcionales (aún no existen en el backend)
  const [subtaskModal, setSubtaskModal] = useState(null); // null | { task? }
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [created, setCreated] = useState(null);
  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Este campo es obligatorio";
    if (!form.date_event) next.date_event = "Este campo es obligatorio";
    if (
      form.date_event &&
      subtasks.some((task) => task.due_date > form.date_event)
    ) {
      next.subtasks =
        "El plazo de una subtarea no puede ser posterior a la fecha del evento";
    }
    return next;
  };

  const submit = async (submitEvent) => {
    submitEvent.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setServerError("");
    try {
      const event = await eventServices.createEvent(form);
      const results = await Promise.allSettled(
        subtasks.map((task) => {
          const payload = { ...task, activity: event.id };
          delete payload.tid; // id temporal solo del frontend
          return eventServices.createSubtask(payload);
        }),
      );
      const rejected = results.filter((result) => result.status === "rejected");
      const conflicts = rejected.filter(({ reason }) =>
        Boolean(reason?.fields?.conflict || reason?.fields?.conflicto),
      );
      setCreated({
        id: event.id,
        failed: rejected.length,
        conflicts: conflicts.length,
      });
    } catch {
      setServerError("No pudimos guardar el evento, por favor reintenta");
    } finally {
      setLoading(false);
    }
  };

  // Verifica la carga antes de guardar la subtarea como borrador del evento.
  const saveSubtask = async (payload) => {
    const capacity = await eventServices.getCapacity(payload.due_date);
    const assignedHours = Number(capacity?.assigned_hours);
    const limitHours = Number(capacity?.limit_hours);
    if (!Number.isFinite(assignedHours) || !Number.isFinite(limitHours)) {
      throw new Error("No pudimos validar la carga diaria. Intenta de nuevo.");
    }

    const otherDraftHours = subtasks.reduce((total, task) => {
      const isBeingEdited = task.tid === subtaskModal?.task?.tid;
      const isActive = task.status === "pending" || task.status === "in_progress";
      return !isBeingEdited && isActive && task.due_date === payload.due_date
        ? total + Number(task.estimated_hours || 0)
        : total;
    }, 0);
    const currentHours = assignedHours + otherDraftHours;
    const proposedHours = Number(payload.estimated_hours);
    const totalHours = currentHours + proposedHours;

    if (totalHours > limitHours) {
      const formatHours = (hours) =>
        Number(hours).toLocaleString("es-CO", { maximumFractionDigits: 1 });
      const message = `Quedarías con ${formatHours(totalHours)}h de gestión planificadas (límite ${formatHours(limitHours)}h).`;
      const error = new Error(message);
      error.fields = {
        conflicto: [message],
        conflict: {
          date: payload.due_date,
          current_hours: currentHours,
          proposed_hours: proposedHours,
          total_hours: totalHours,
          limit_hours: limitHours,
          excess_hours: totalHours - limitHours,
          exceeds: true,
          options: ["move", "reduce_hours", "postpone"],
        },
      };
      throw error;
    }

    setSubtasks((current) =>
      subtaskModal?.task
        ? current.map((task) =>
            task.tid === subtaskModal.task.tid
              ? { ...payload, tid: task.tid }
              : task,
          )
        : [...current, { ...payload, tid: `t${Date.now()}` }],
    );
    setSubtaskModal(null);
  };

  const field = (label, name, type = "text", placeholder = "") => (
    <label className={`form-field ${errors[name] ? "has-error" : ""}`}>
      <span>{label}</span>
      <input
        type={type}
        value={form[name]}
        placeholder={placeholder}
        disabled={loading}
        onChange={(e) => update(name, e.target.value)}
      />
      {errors[name] && <small>{errors[name]}</small>}
    </label>
  );

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <h1>Crear evento</h1>
          <p>Construye el plan logístico inicial de tu evento.</p>
        </div>
      </header>

      <form className="conversation-form" onSubmit={submit} noValidate>
        <div className="form-block">
          <h2>¿Qué evento estás organizando?</h2>
          {field(
            "Nombre del evento*",
            "name",
            "text",
            "Ej. Boda de Luis y Alejandra",
          )}
          {field("Tipo de evento", "event_type", "text", "Ej. Boda")}
        </div>

        <div className="form-block">
          <h2>¿Cuándo y dónde será?</h2>
          {field("Fecha del evento*", "date_event", "date")}
          {field("Lugar", "location", "text", "Ej. Club Campestre Cali")}
        </div>

        <div className="form-block">
          <h2>¿Para quién es y qué debemos recordar?</h2>
          {field("Cliente", "client")}
          <label className="form-field">
            <span>Descripción</span>
            <textarea
              value={form.description}
              disabled={loading}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>
        </div>

        <div className="form-block">
          <div className="form-block-head">
            <h2>Subtareas logísticas (opcional)</h2>
            <button
              type="button"
              className="button button-neutral"
              disabled={loading}
              onClick={() => setSubtaskModal({})}
            >
              <Plus size={16} /> Agregar subtarea
            </button>
          </div>
          {!subtasks.length && (
            <p className="form-hint">
              Puedes agregar las gestiones ahora o hacerlo después desde el
              detalle del evento.
            </p>
          )}
          {subtasks.map((task) => (
            <SubtaskRow
              key={task.tid}
              task={task}
              showStatus={false}
              onEdit={(item) => setSubtaskModal({ task: item })}
              onDelete={(item) =>
                setSubtasks((current) =>
                  current.filter((t) => t.tid !== item.tid),
                )
              }
            />
          ))}
          {errors.subtasks && (
            <small className="field-error">{errors.subtasks}</small>
          )}
        </div>

        {serverError && <FormError message={serverError} />}
        <button
          className="button button-primary submit-button"
          disabled={loading}
        >
          {loading ? <LoadingSpinner /> : "Crear evento"}
        </button>
      </form>

      {/* Los modales van FUERA del <form> para no anidar formularios */}
      {subtaskModal && (
        <SubtaskModal
          key={subtaskModal.task?.tid || "new"}
          activityId={null}
          eventDate={form.date_event}
          task={subtaskModal.task}
          onClose={() => setSubtaskModal(null)}
          onSubmit={saveSubtask}
        />
      )}
      {created && (
        <SuccessModal
          title={
            created.conflicts
              ? "¡Evento creado con conflictos!"
              : "¡Evento creado!"
          }
          message={
            created.failed
              ? created.conflicts === created.failed
                ? `El evento se creó correctamente, pero ${created.failed} subtarea(s) no se guardaron porque exceden el límite diario de carga. Agrégalas o reprográmalas desde el detalle del evento.`
                : created.conflicts
                  ? `El evento se creó, pero ${created.conflicts} subtarea(s) no se guardaron por conflictos de sobrecarga. Las demás subtareas tampoco pudieron guardarse. Revisa el evento para agregarlas o reprogramarlas.`
                  : `El evento se creó, pero ${created.failed} subtarea(s) no se pudieron guardar. Agrégalas desde el detalle.`
              : "El evento ha sido creado con éxito"
          }
          onAccept={() => navigate(`/evento/${created.id}`)}
        />
      )}
    </div>
  );
}
