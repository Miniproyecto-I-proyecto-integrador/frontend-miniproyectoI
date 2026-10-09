import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

const formatHours = (value) =>
  Number(value).toLocaleString("es-CO", { maximumFractionDigits: 1 });

// 1. Modal para seleccionar la nueva fecha (DatePicker)
export function RescheduleModal({
  task,
  initialDate,
  suggestionMessage,
  onClose,
  onConfirm,
}) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate || task.due_date || "",
  );
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = initialDate || task.due_date;
    const d = initial ? new Date(`${initial}T00:00:00`) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Relleno de días del mes anterior
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }

    // Días del mes actual
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(i).padStart(2, "0");
      const dateString = `${year}-${monthStr}-${dayStr}`;
      days.push({ day: i, dateString });
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card reschedule-modal">
        <h2 className="modal-title-accent">Reprogramar</h2>
        <p className="modal-subtitle">
          <Info size={16} /> Elige una nueva fecha
        </p>
        {suggestionMessage && (
          <p className="modal-subtitle">{suggestionMessage}</p>
        )}

        <div className="custom-datepicker">
          <div className="datepicker-header">
            <button type="button" onClick={handlePrevMonth} className="icon-btn">
              <ChevronLeft size={18} />
            </button>
            <div className="datepicker-selectors">
              <span className="month-label">{monthNames[currentMonth.getMonth()]}</span>
              <span className="year-label">{currentMonth.getFullYear()}</span>
            </div>
            <button type="button" onClick={handleNextMonth} className="icon-btn">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="datepicker-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="day-name">{d}</span>
            ))}
            {daysInMonth.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled={
                  !item.day ||
                  Boolean(task.eventDate && item.dateString > task.eventDate)
                }
                className={`day-cell ${
                  item.dateString === selectedDate ? "selected" : ""
                }`}
                onClick={() => item.dateString && setSelectedDate(item.dateString)}
              >
                {item.day || ""}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions gap-12">
          <button type="button" className="btn-text" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedDate}
            onClick={() => onConfirm(selectedDate)}
          >
            Reprogramar
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Modal de Conflicto de Sobrecarga (HU-07)
export function OverloadConflictModal({
  task,
  targetDate,
  conflict,
  onCancel,
  onReduceHours,
  onMoveOtherDay,
}) {
  const projectedHours = Number(conflict?.total_hours) || 0;
  const limitHours = Number(conflict?.limit_hours) || 0;
  const availableOptions = conflict?.options || [];

  return (
    <div className="modal-backdrop">
      <div className="modal-card overload-modal">
        <h2 className="modal-title-accent">Conflicto de sobrecarga</h2>
        <p className="modal-subtitle">
          <Info size={16} />Quedarías con {" "}
          <strong>{formatHours(projectedHours)}h</strong> planificadas (el límite
          es <strong>{formatHours(limitHours)}h</strong>).
        </p>

        <div className="modal-actions conflict-actions">
          <button type="button" className="btn-outline-danger" onClick={onCancel}>
            Cancelar
          </button>
          {(!availableOptions.length ||
            availableOptions.includes("reduce_hours")) && (
            <button type="button" className="btn-dark" onClick={onReduceHours}>
              Reducir horas
            </button>
          )}
          {(!availableOptions.length || availableOptions.includes("move")) && (
            <button
              type="button"
              className="btn-primary"
              onClick={onMoveOtherDay}
            >
              Mover a otro día
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Modal para Reducir Horas Estimadas (HU-08)
export function ReduceHoursModal({
  task,
  conflict,
  onClose,
  onConfirm,
}) {
  const currentHours = Number(task.estimated_hours) || 0;
  const assignedHours = Number(conflict?.current_hours) || 0;
  const limitHours = Number(conflict?.limit_hours) || 0;
  const availableHours = Math.max(0, limitHours - assignedHours);
  const maxHoursBelowCurrent =
    (Math.ceil(currentHours * 10 - 1e-8) - 1) / 10;
  const maxAllowedForTask =
    Math.floor(
      Math.min(maxHoursBelowCurrent, availableHours) * 10 + 1e-8,
    ) / 10;
  const [selectedHours, setSelectedHours] = useState(
    maxAllowedForTask > 0 ? maxAllowedForTask : "",
  );

  const hourOptions = useMemo(() => {
    const options = [];
    for (let tenths = 1; tenths <= Math.round(maxAllowedForTask * 10); tenths++) {
      options.push(tenths / 10);
    }
    return options.reverse();
  }, [maxAllowedForTask]);

  return (
    <div className="modal-backdrop">
      <div className="modal-card reduce-hours-modal">
        <h2 className="modal-title-accent">Reducir horas estimadas</h2>
        <p className="modal-subtitle">
          <Info size={16} /> Subtarea: <strong>"{task.name}"</strong>
        </p>

        <div className="read-only-grid">
          <div className="field-group">
            <label>Horas actuales:</label>
            <input type="text" value={`${formatHours(currentHours)}h`} disabled />
          </div>
          <div className="field-group">
            <label>Horas del día planificadas:</label>
            <input type="text" value={`${formatHours(assignedHours)}h`} disabled />
          </div>
        </div>

        <div className="form-group margin-top-12">
          <label>Horas estimadas nuevas:</label>
          <select
            value={selectedHours}
            onChange={(e) => setSelectedHours(Number(e.target.value))}
            disabled={!hourOptions.length}
          >
            {hourOptions.map((h) => (
              <option key={h} value={h}>
                {formatHours(h)} {h === 1 ? "hora" : "horas"}
              </option>
            ))}
          </select>
        </div>
        {!hourOptions.length && (
          <p className="modal-subtitle">
            No es posible resolver este conflicto reduciendo las horas. Elige
            otro día.
          </p>
        )}

        <div className="modal-actions gap-12 margin-top-20">
          <button type="button" className="btn-outline-danger" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!hourOptions.length || !selectedHours}
            onClick={() => onConfirm(selectedHours)}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Modal de Error al Actualizar
export function ActionErrorModal({ title, message, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card error-modal">
        <h2>{title || "Error al actualizar"}</h2>
        <p className="modal-subtitle center-text">
          <Info size={16} /> {message}
        </p>
        <div className="modal-actions center-actions">
          <button type="button" className="btn-danger-solid" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}