import { CalendarDays } from 'lucide-react'

export default function EmptyState({ message, action, onAction }) {
  return <div className="empty-state"><CalendarDays size={34} /><p>{message}</p>{action && <button className="button button-primary" onClick={onAction}>{action}</button>}</div>
}
