import { CalendarDays } from "lucide-react";

//Component that displays an empty state message with an optional action button

export default function EmptyState({ message, action, onAction }) {
  return (
    <div className="empty-state">
      <CalendarDays size={34} />
      <p>{message}</p>

      {action && (
        <button className="button button-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
