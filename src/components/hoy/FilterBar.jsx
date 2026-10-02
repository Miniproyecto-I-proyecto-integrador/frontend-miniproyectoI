import { ChevronDown } from "lucide-react";

export default function FilterBar({
  events,
  eventFilter,
  statusFilter,
  onEventChange,
  onStatusChange,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-select">
        <select
          value={eventFilter}
          onChange={(event) => onEventChange(event.target.value)}
          aria-label="Filtrar por evento"
        >
          <option value="all">Evento: Todos los eventos</option>
          {events.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <ChevronDown className="filter-icon" size={16} />
      </div>

      <div className="filter-select">
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="all">Estado: Todos</option>
          <option value="pending">Estado: Pendientes</option>
          <option value="done">Estado: Completadas</option>
        </select>
        <ChevronDown className="filter-icon" size={16} />
      </div>
    </div>
  );
}
