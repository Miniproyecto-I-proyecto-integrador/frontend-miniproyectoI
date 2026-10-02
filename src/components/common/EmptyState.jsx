import { CalendarDays } from "lucide-react";

//Component that displays an empty state message with an optional action button

export default function EmptyState({ title, message, action, onAction }) {
  return (
    <div className="empty-state">
      <CalendarDays size={34} />
      {title && <h2 className="state-title">{title}</h2>}
      <p>{message}</p>

      {action && (
        <button className="button button-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
