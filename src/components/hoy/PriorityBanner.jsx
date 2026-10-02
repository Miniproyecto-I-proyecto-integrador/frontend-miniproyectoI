// Regla visible de priorización que usa el panel de Hoy.
export default function PriorityBanner() {
  return (
    <div
      className="priority-banner priority-rule"
      aria-label="Regla de prioridad"
    >
      <strong>Atención:</strong>
      <span>
        Las gestiones se agrupan en vencidas, para hoy y próximas, priorizando
        primero las más urgentes. En caso de empate, se muestran primero las que
        requieren menos esfuerzo.
      </span>
    </div>
  );
}
