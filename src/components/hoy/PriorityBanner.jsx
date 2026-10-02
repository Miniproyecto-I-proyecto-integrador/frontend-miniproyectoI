// Regla visible de priorización que usa el panel de Hoy.
export default function PriorityBanner() {
  return (
    <div
      className="priority-banner priority-rule"
      aria-label="Regla de prioridad"
    >
      <strong>Atención:</strong>
      <span>
        Las gestiones se agrupan en vencidas, para hoy y próximas. Dentro de
        cada grupo se ordenan por fecha (las vencidas más antiguas primero y las
        próximas más cercanas primero); si coinciden, va primero la que requiere
        menos horas.
      </span>
    </div>
  );
}
