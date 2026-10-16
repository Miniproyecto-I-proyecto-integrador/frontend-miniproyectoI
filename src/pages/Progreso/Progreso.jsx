import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { eventServices } from "../../api/eventServices";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SuccessModal from "../../components/common/SuccessModal";
import SubtaskModal from "../../components/events/SubtaskModal";
import { getToday } from "../../utils/hoy";

function CircularProgress({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const size = 124;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const strokeColor = clamped === 100 ? "#16a34a" : "#2563eb";

  return (
    <div className="progreso-donut" aria-label={`${clamped}% completado`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="progreso-donut-svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="progreso-donut-ring"
          />
        )}
      </svg>
      <div className="progreso-donut-center">
        <strong>{clamped}%</strong>
        <span>completado</span>
      </div>
    </div>
  );
}

export default function Progreso() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [creatingSubtaskFor, setCreatingSubtaskFor] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const list = await eventServices.listEvents();
      const eventsArray = Array.isArray(list) ? list : [];

      const enriched = await Promise.all(
        eventsArray.map(async (event) => {
          const subtasks = Array.isArray(event.subtasks) ? event.subtasks : [];
          const fallbackTotal = subtasks.length;
          const fallbackCompleted = subtasks.filter(
            (task) => task.status === "done",
          ).length;
          const fallbackProgress =
            fallbackTotal > 0
              ? Math.round((fallbackCompleted / fallbackTotal) * 100)
              : 0;

          try {
            const progressData = await eventServices.getProgress(event.id);
            const totalSubtasks = Number(
              progressData?.total_subtasks ?? fallbackTotal,
            );
            const completedSubtasks =
              totalSubtasks === 0
                ? 0
                : Number(progressData?.completed_subtasks ?? fallbackCompleted);
            const progress =
              totalSubtasks === 0
                ? 0
                : Number(progressData?.progress ?? fallbackProgress);

            return {
              ...event,
              subtasks,
              total_subtasks: totalSubtasks,
              completed_subtasks: completedSubtasks,
              progress,
            };
          } catch {
            return {
              ...event,
              subtasks,
              total_subtasks: fallbackTotal,
              completed_subtasks: fallbackCompleted,
              progress: fallbackProgress,
            };
          }
        }),
      );

      setEvents(enriched);
      setStatus("ready");
    } catch {
      if (!silent) setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    const handleRefresh = () => {
      void load(true);
    };

    window.addEventListener("tasks-updated", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("tasks-updated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [load]);

  const handleCreateSubtask = async (payload) => {
    await eventServices.createSubtask(payload);
    setCreatingSubtaskFor(null);
    setSuccess({
      title: "¡Subtarea creada!",
      message: "La subtarea ha sido creada con éxito",
    });
    await load(true);
    window.dispatchEvent(new Event("tasks-updated"));
  };

  const today = getToday();

  const summary = useMemo(() => {
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let overdueSubtasks = 0;

    events.forEach((event) => {
      const subtasks = event.subtasks || [];
      const eventTotal = Number(event.total_subtasks ?? subtasks.length) || 0;
      const eventCompleted =
        eventTotal === 0
          ? 0
          : Number(
              event.completed_subtasks ??
                subtasks.filter((task) => task.status === "done").length,
            ) || 0;

      totalSubtasks += eventTotal;
      completedSubtasks += eventCompleted;

      subtasks.forEach((task) => {
        if (
          task.status !== "done" &&
          task.due_date &&
          task.due_date < today
        ) {
          overdueSubtasks += 1;
        }
      });
    });

    const pendingSubtasks = Math.max(
      0,
      totalSubtasks - completedSubtasks - overdueSubtasks,
    );
    const generalProgress =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    return {
      totalSubtasks,
      completedSubtasks,
      pendingSubtasks,
      overdueSubtasks,
      generalProgress,
    };
  }, [events, today]);

  const header = (
    <header className="page-header">
      <div>
        <h1>Progreso</h1>
        <p>Mira cuánto llevas de la preparación de cada evento.</p>
      </div>
      <button
        type="button"
        className="button button-primary"
        onClick={() => navigate("/crear")}
      >
        <Plus size={17} /> Crear evento
      </button>
    </header>
  );

  if (status === "loading") {
    return (
      <div className="page progreso-page">
        {header}
        <div className="center-state">
          <div className="loading-message progreso-loading">
            <LoadingSpinner label="Calculando el progreso de tus eventos" />
            <p>Calculando el progreso de tus eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page progreso-page">
        {header}
        <ErrorState
          message="No pudimos cargar el progreso de tus eventos, por favor reintenta."
          onRetry={() => load()}
        />
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="page progreso-page">
        {header}
        <div className="progreso-empty-wrapper">
          <EmptyState
            message="Aún no tienes eventos planificados. Crea tu primer evento y sus subtareas para ver tu progreso."
            action="Crear evento"
            onAction={() => navigate("/crear")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page progreso-page">
      {header}

      <section
        className="progreso-general-card"
        aria-label="Progreso general"
      >
        <CircularProgress value={summary.generalProgress} />

        <div className="progreso-general-body">
          <div className="progreso-general-header">
            <h2>Progreso general</h2>
            <p>
              <strong>
                {summary.completedSubtasks} de {summary.totalSubtasks}
              </strong>{" "}
              tareas completadas en todos tus eventos
            </p>
          </div>

          <div className="progreso-bar-section">
            <div className="progress-label">
              <span>Avance total</span>
              <strong>{summary.generalProgress}%</strong>
            </div>
            <div className="progress-track progreso-track-lg">
              <span
                className={`progress-fill progress-${
                  summary.generalProgress === 100
                    ? "done"
                    : summary.generalProgress > 0
                      ? "active"
                      : "empty"
                }`}
                style={{ width: `${summary.generalProgress}%` }}
              />
            </div>
          </div>

          <div className="progreso-kpi-grid">
            <div className="progreso-kpi-card kpi-completed">
              <CheckCircle2 size={20} className="progreso-kpi-icon" />
              <div className="progreso-kpi-info">
                <strong>{summary.completedSubtasks}</strong>
                <span>Completadas</span>
              </div>
            </div>

            <div className="progreso-kpi-card kpi-pending">
              <Clock3 size={20} className="progreso-kpi-icon" />
              <div className="progreso-kpi-info">
                <strong>{summary.pendingSubtasks}</strong>
                <span>Pendientes</span>
              </div>
            </div>

            <div className="progreso-kpi-card kpi-overdue">
              <AlertCircle size={20} className="progreso-kpi-icon" />
              <div className="progreso-kpi-info">
                <strong>{summary.overdueSubtasks}</strong>
                <span>Vencidas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="progreso-events-grid"
        aria-label="Progreso por evento"
      >
        {events.map((event) => {
          const subtasks = event.subtasks || [];
          const total = Number(event.total_subtasks ?? subtasks.length) || 0;
          const completed =
            total === 0
              ? 0
              : Number(
                  event.completed_subtasks ??
                    subtasks.filter((task) => task.status === "done").length,
                ) || 0;
          const progress =
            total === 0
              ? 0
              : Number(
                  event.progress ?? Math.round((completed / total) * 100),
                ) || 0;
          const remaining = Math.max(0, total - completed);
          const postponed = subtasks.filter(
            (task) => task.status === "postponed",
          ).length;
          const isCompleted =
            total > 0 && (progress === 100 || completed === total);

          return (
            <article key={event.id} className="progreso-event-card">
              <div className="progreso-event-head">
                <div>
                  <h2>{event.name}</h2>
                  <p>{event.date_event}</p>
                </div>
                {isCompleted && (
                  <span className="progreso-ready-badge">Todo listo</span>
                )}
              </div>

              {total === 0 ? (
                <div className="progreso-no-subtasks">
                  <p>
                    Este evento aún no tiene subtareas. Agrégalas para medir tu
                    avance.
                  </p>
                  <button
                    type="button"
                    className="progreso-create-subtask-btn"
                    onClick={() => setCreatingSubtaskFor(event)}
                  >
                    Crear subtarea
                  </button>
                </div>
              ) : (
                <>
                  <div className="progreso-event-progress">
                    <div className="progress-label">
                      <span>Progreso del evento</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        className={`progress-fill progress-${
                          progress === 100
                            ? "done"
                            : progress > 0
                              ? "active"
                              : "empty"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="progreso-event-summary">
                    <strong>{completed}</strong> de <strong>{total}</strong>{" "}
                    gestiones ejecutadas
                    {remaining > 0 ? ` · faltan ${remaining}` : ""}
                    {postponed > 0
                      ? ` · ${postponed} ${postponed === 1 ? "pospuesta" : "pospuestas"}`
                      : ""}
                  </p>

                  <Link className="detail-link" to={`/evento/${event.id}`}>
                    <ExternalLink size={15} /> ver detalle
                  </Link>
                </>
              )}
            </article>
          );
        })}
      </section>

      {creatingSubtaskFor && (
        <SubtaskModal
          key={creatingSubtaskFor.id}
          activityId={creatingSubtaskFor.id}
          eventDate={creatingSubtaskFor.date_event}
          onClose={() => setCreatingSubtaskFor(null)}
          onSubmit={handleCreateSubtask}
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

