import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  Info,
  Minus,
  Plus,
} from "lucide-react";

const formatHours = (value) =>
  Number(value).toLocaleString("es-CO", {
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
    maximumFractionDigits: 1,
  });

const formatDate = (value, options) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", options).format(
    new Date(year, month - 1, day),
  );
};

const formatHoursInput = (value) => Number(value).toFixed(1);

const moveHours = (loads, date, amount) => {
  loads.set(date, Math.max(0, (loads.get(date) || 0) + amount));
};

export default function DailyLimitConflictModal({
  previousLimit,
  limit,
  overloadedDays,
  dailyLoads,
  today,
  saving,
  error,
  onCancel,
  onSave,
}) {
  const dialogRef = useRef(null);
  const savingRef = useRef(saving);
  const cancelRef = useRef(onCancel);
  const [actions, setActions] = useState({});

  const tasks = useMemo(
    () =>
      overloadedDays.flatMap((day) =>
        day.subtasks.map((task) => ({
          ...task,
          conflictDate: day.date,
          conflictLimit: day.limit_hours,
        })),
      ),
    [overloadedDays],
  );

  const projectedLoads = useMemo(() => {
    const loads = new Map(
      dailyLoads.map((item) => [item.date, Number(item.total_hours)]),
    );

    tasks.forEach((task) => {
      const action = actions[task.id];
      if (!action || action.type === "keep") return;

      const hours = Number(task.estimated_hours);
      if (action.type === "move" && action.due_date) {
        moveHours(loads, task.conflictDate, -hours);
        moveHours(loads, action.due_date, hours);
      } else if (action.type === "reduce_hours") {
        moveHours(loads, task.conflictDate, Number(action.estimated_hours) - hours);
      }
    });
    return loads;
  }, [actions, dailyLoads, tasks]);

  const affectedDates = useMemo(() => {
    const dates = new Set(overloadedDays.map((day) => day.date));
    tasks.forEach((task) => {
      const action = actions[task.id];
      if (action?.type === "move" && action.due_date) dates.add(action.due_date);
    });
    return [...dates].sort();
  }, [actions, overloadedDays, tasks]);

  const remainingExcess = affectedDates.reduce(
    (total, date) =>
      total + Math.max(0, (projectedLoads.get(date) || 0) - Number(limit)),
    0,
  );
  const resolved = remainingExcess < 0.0001;

  useEffect(() => {
    savingRef.current = saving;
    cancelRef.current = onCancel;
  }, [saving, onCancel]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const firstControl = dialog?.querySelector(
      'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
    );
    (firstControl || dialog)?.focus();

    const trapFocus = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!savingRef.current) cancelRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const controls = [...dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex="0"]',
      )];
      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector(".limit-toggle-button")?.focus();
    };
  }, []);

  const setTaskAction = (task, type) => {
    if (type === "keep") {
      setActions((current) => ({ ...current, [task.id]: { type } }));
      return;
    }

    if (type === "move") {
      setActions((current) => ({
        ...current,
        [task.id]: {
          type,
          due_date: task.suggested_dates?.[0]?.date || "",
        },
      }));
      return;
    }

    const hours = Number(task.estimated_hours);
    const maxReducibleHours = Math.floor(hours * 2 + 1e-8) / 2;
    const currentAction = actions[task.id];
    let totalWithOriginalHours = projectedLoads.get(task.conflictDate) || 0;
    if (currentAction?.type === "move") {
      totalWithOriginalHours += hours;
    } else if (currentAction?.type === "reduce_hours") {
      totalWithOriginalHours +=
        hours - Number(currentAction.estimated_hours);
    }
    const excess = Math.max(0, totalWithOriginalHours - Number(limit));
    const requiredReduction = Math.max(0.5, excess);
    const selectedHours = Math.max(
      0.5,
      Math.min(
        maxReducibleHours,
        Math.floor((hours - requiredReduction) * 2 + 1e-8) / 2,
      ),
    );
    setActions((current) => ({
      ...current,
      [task.id]: { type, estimated_hours: selectedHours },
    }));
  };

  const projectedCandidate = (task, candidateDate) => {
    const currentAction = actions[task.id];
    const hours = Number(task.estimated_hours);
    const loads = new Map(projectedLoads);

    if (currentAction?.type === "move" && currentAction.due_date) {
      moveHours(loads, task.conflictDate, hours);
      moveHours(loads, currentAction.due_date, -hours);
    } else if (currentAction?.type === "reduce_hours") {
      moveHours(
        loads,
        task.conflictDate,
        hours - Number(currentAction.estimated_hours),
      );
    }
    const current = loads.get(candidateDate) || 0;
    return { current, total: current + hours };
  };

  const getMinimumHours = (task) => {
    const action = actions[task.id];
    const existing = Number(task.estimated_hours);
    const onOrigin = action?.type === "move"
      ? 0
      : action?.type === "reduce_hours"
        ? Number(action.estimated_hours)
        : existing;
    const others = Math.max(
      0,
      (projectedLoads.get(task.conflictDate) || 0) - onOrigin,
    );
    return Math.min(existing, Math.max(0.5, Number(limit) - others));
  };

  const changes = tasks.flatMap((task) => {
    const action = actions[task.id];
    if (action?.type === "move" && action.due_date) {
      return [{
        subtask_id: task.id,
        action: "move",
        due_date: action.due_date,
      }];
    }
    if (action?.type === "reduce_hours") {
      return [{
        subtask_id: task.id,
        action: "reduce_hours",
        estimated_hours: formatHoursInput(action.estimated_hours),
      }];
    }
    return [];
  });

  const handleSave = async () => {
    if (!resolved || saving) return;
    await onSave(changes);
  };

  return createPortal(
    <div className="modal-backdrop daily-limit-resolution-backdrop">
      <section
        className={`daily-limit-resolution-modal ${resolved ? "is-resolved" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-limit-resolution-title"
        aria-describedby="daily-limit-resolution-description"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="daily-limit-resolution-heading" aria-live="polite">
          {resolved ? (
            <CircleCheck size={34} aria-hidden="true" />
          ) : (
            <CircleAlert size={34} aria-hidden="true" />
          )}
          <h2 id="daily-limit-resolution-title">
            {resolved ? "Conflicto resuelto" : "Este límite genera un conflicto"}
          </h2>
          <p id="daily-limit-resolution-description">
            {resolved
              ? <>Con estos cambios tu plan queda dentro del nuevo límite de <strong>{formatHours(limit)} h por día.</strong></>
              : <>Vas a cambiar tu límite de <strong>{formatHours(previousLimit)} h</strong> a <strong>{formatHours(limit)} h por día.</strong> No se guardará hasta que resuelvas el exceso o canceles el cambio.</>}
          </p>
        </div>

        <div className="daily-limit-resolution-content">
          {overloadedDays.map((day) => {
            const projected = projectedLoads.get(day.date) || 0;
            const excess = Math.max(0, projected - Number(limit));

            return (
              <section className="daily-limit-resolution-day" key={day.date}>
                <div className="daily-limit-resolution-day-top">
                  <strong>
                    <CalendarDays size={17} aria-hidden="true" />
                    {formatDate(day.date, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <span className={`daily-limit-resolution-badge ${excess ? "is-over" : "is-within"}`}>
                    {excess
                      ? `Excedes por ${formatHours(excess)}h`
                      : "Dentro del límite"}
                  </span>
                </div>

                <p className="daily-limit-resolution-day-summary">
                  Plan: <strong>{formatHours(projected)}h</strong>
                  {" · "}Límite: <strong>{formatHours(limit)}h</strong>
                </p>

                <div className="daily-limit-resolution-tasks-heading">
                  <strong>Gestiones del día</strong>
                  <span>
                    Mueve o reduce al menos una para respetar el límite.
                  </span>
                </div>

                <div className="daily-limit-resolution-task-list">
                  {day.subtasks.map((task) => {
                    const action = actions[task.id] || { type: "keep" };
                    const estimated = Number(task.estimated_hours);
                    const maxReducibleHours =
                      Math.floor(estimated * 2 + 1e-8) / 2;
                    const currentHours = Number(
                      action.estimated_hours ?? task.estimated_hours,
                    );
                    const minimumHours = getMinimumHours(task);
                    const suggestedDates = task.suggested_dates || [];
                    const selectedDestination =
                      action.type === "move" ? action.due_date : null;

                    return (
                      <article
                        className={`daily-limit-resolution-task ${action.type !== "keep" ? "has-change" : ""}`}
                        key={task.id}
                      >
                        <div className="daily-limit-resolution-task-main">
                          <div className="daily-limit-resolution-task-info">
                            <strong>{task.name}</strong>
                            <span>
                              {task.activity_name} · {formatHours(estimated)}h
                            </span>
                          </div>
                          <div
                            className="daily-limit-resolution-radio-group"
                            role="radiogroup"
                            aria-label={`Qué hacer con ${task.name}`}
                          >
                            {[
                              ["keep", "Mantener"],
                              ["move", "Mover a otro día"],
                              ["reduce_hours", "Reducir horas"],
                            ].map(([type, label]) => (
                              <label
                                className={`daily-limit-resolution-choice ${action.type === type ? "is-selected" : ""}`}
                                key={type}
                              >
                                <input
                                  type="radio"
                                  name={`resolution-${task.id}`}
                                  value={type}
                                  checked={action.type === type}
                                  disabled={
                                    saving ||
                                    (type === "reduce_hours" &&
                                      maxReducibleHours <= 0.5)
                                  }
                                  onChange={() => setTaskAction(task, type)}
                                />
                                {type === "move" ? (
                                  <CalendarDays size={15} aria-hidden="true" />
                                ) : type === "reduce_hours" ? (
                                  <Clock3 size={15} aria-hidden="true" />
                                ) : null}
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {action.type === "move" && (
                          <div className="daily-limit-resolution-action-panel">
                            <strong>Fechas con espacio disponible para {formatHours(estimated)}h</strong>
                            {suggestedDates.length ? (
                              <div className="daily-limit-resolution-suggestions">
                                {suggestedDates.map((candidate, index) => {
                                  const projection = projectedCandidate(task, candidate.date);
                                  return (
                                    <button
                                      type="button"
                                      className={`daily-limit-resolution-suggestion ${selectedDestination === candidate.date ? "is-selected" : ""}`}
                                      key={candidate.date}
                                      disabled={saving}
                                      onClick={() => setActions((current) => ({
                                        ...current,
                                        [task.id]: { ...action, due_date: candidate.date },
                                      }))}
                                    >
                                      {index === 0 && <span className="suggested-label">Sugerida</span>}
                                      <strong>
                                        {formatDate(candidate.date, {
                                          weekday: "short",
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </strong>
                                      <span>{formatHours(projection.current)}h planificadas</span>
                                      <b>
                                        Quedaría con {formatHours(projection.total)}h (límite {formatHours(limit)}h)
                                      </b>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p>No encontramos una fecha con espacio antes de la fecha del evento.</p>
                            )}
                            <label className="daily-limit-resolution-calendar">
                              <CalendarDays size={16} aria-hidden="true" />
                              <span>Elegir otra fecha en el calendario</span>
                              <input
                                type="date"
                                aria-label={`Elegir otra fecha para ${task.name}`}
                                min={today}
                                max={task.event_date}
                                value={selectedDestination || ""}
                                disabled={saving}
                                onChange={(event) => setActions((current) => ({
                                  ...current,
                                  [task.id]: { ...action, due_date: event.target.value },
                                }))}
                              />
                            </label>
                          </div>
                        )}

                        {action.type === "reduce_hours" && (
                          <div className="daily-limit-resolution-action-panel">
                            <strong>Horas estimadas para {task.name}</strong>
                            <div className="daily-limit-resolution-reducer">
                              <button
                                type="button"
                                aria-label={`Reducir horas de ${task.name}`}
                                disabled={saving || currentHours <= 0.5}
                                onClick={() => setActions((current) => ({
                                  ...current,
                                  [task.id]: {
                                    ...action,
                                    estimated_hours: Math.max(0.5, currentHours - 0.5),
                                  },
                                }))}
                              >
                                <Minus size={18} />
                              </button>
                              <output aria-live="polite">{formatHoursInput(currentHours)}h</output>
                              <button
                                type="button"
                                aria-label={`Aumentar horas de ${task.name}`}
                                disabled={
                                  saving || currentHours >= maxReducibleHours
                                }
                                onClick={() => setActions((current) => ({
                                  ...current,
                                  [task.id]: {
                                    ...action,
                                    estimated_hours: Math.min(
                                      maxReducibleHours,
                                      currentHours + 0.5,
                                    ),
                                  },
                                }))}
                              >
                                <Plus size={18} />
                              </button>
                              <span className="daily-limit-resolution-reduction">
                                {formatHours(estimated)}h → <strong>{formatHours(currentHours)}h</strong>
                                {" · "}{formatHours(estimated - currentHours)}h menos
                              </span>
                            </div>
                            <p className="daily-limit-resolution-minimum">
                              <Info size={14} />
                              Mínimo para resolver el conflicto: {formatHours(minimumHours)}h · Puedes bajar hasta 0.5h
                            </p>
                            <div className="daily-limit-resolution-warning" role="note">
                              <AlertTriangle size={15} />
                              Las horas estimadas de {task.name} cambiarán de {formatHours(estimated)}h a {formatHours(currentHours)}h en /hoy y en el detalle del evento.
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {affectedDates.some((date) => !overloadedDays.some((day) => day.date === date)) && (
            <section className="daily-limit-resolution-affected" aria-live="polite">
              <strong>Días afectados por los cambios</strong>
              {affectedDates
                .filter((date) => !overloadedDays.some((day) => day.date === date))
                .map((date) => (
                  <span key={date}>
                    {formatDate(date, { weekday: "short", day: "numeric", month: "short" })}:{" "}
                    {formatHours(projectedLoads.get(date) || 0)}h planificadas
                    {" · "}
                    {(projectedLoads.get(date) || 0) <= Number(limit)
                      ? "Dentro del límite"
                      : `Excedes por ${formatHours((projectedLoads.get(date) || 0) - Number(limit))}h`}
                  </span>
                ))}
            </section>
          )}

          {resolved && changes.length > 0 && (
            <div className="daily-limit-resolution-summary" aria-live="polite">
              <strong>Resumen de cambios:</strong> límite de {formatHours(previousLimit)}h a {formatHours(limit)}h
              {changes.map((change) => {
                const task = tasks.find((item) => item.id === change.subtask_id);
                if (!task) return null;
                return (
                  <span key={change.subtask_id}>
                    {" · "}{task.name}{" "}
                    {change.action === "move"
                      ? `pasa al ${formatDate(change.due_date, { weekday: "short", day: "numeric", month: "short" })} (${formatHours(projectedLoads.get(task.conflictDate) || 0)}h quedan en el día de origen)`
                      : `pasa de ${formatHours(task.estimated_hours)}h a ${formatHours(change.estimated_hours)}h (el ${formatDate(task.conflictDate, { weekday: "short", day: "numeric", month: "short" })} suma ${formatHours(projectedLoads.get(task.conflictDate) || 0)}h)`}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <footer className="daily-limit-resolution-footer">
          <div className="daily-limit-resolution-error" aria-live="assertive">
            {error && (
              <>
                <CircleAlert size={16} />
                <span>{error}</span>
                <button type="button" onClick={handleSave} disabled={saving || !resolved}>
                  Reintentar
                </button>
              </>
            )}
          </div>
          <div className="daily-limit-resolution-footer-actions">
            <button
              type="button"
              className="daily-limit-resolution-cancel"
              disabled={saving}
              onClick={onCancel}
            >
              Cancelar cambio de límite
            </button>
            {!resolved && (
              <span className="daily-limit-resolution-remaining">
                Aún faltan {formatHours(remainingExcess)}h por resolver
              </span>
            )}
            <button
              type="button"
              className="daily-limit-resolution-save"
              disabled={!resolved || saving}
              onClick={handleSave}
            >
              {saving ? "Guardando..." : "Guardar límite y aplicar cambios"}
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
