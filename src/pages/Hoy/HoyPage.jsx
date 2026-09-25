import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, MoreVertical } from 'lucide-react'
import { eventServices } from '../../api/eventServices'
import FilterBar from '../../components/hoy/FilterBar'
import PriorityBanner from '../../components/hoy/PriorityBanner'
import ConflictModal from '../../components/hoy/ConflictModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const today = () => new Date().toISOString().slice(0, 10)
const group = (task) => task.status === 'done' ? 'completadas' : task.due_date < today() ? 'vencidas' : task.due_date === today() ? 'hoy' : 'proximas'
export default function HoyPage() {
  const [events, setEvents] = useState([]); const [status, setStatus] = useState('loading'); const [eventFilter, setEventFilter] = useState('all'); const [statusFilter, setStatusFilter] = useState('pending'); const [conflict, setConflict] = useState(false)
  useEffect(() => { eventServices.listEvents().then((data) => { setEvents(data); setStatus('ready') }).catch(() => setStatus('error')) }, [])
  const tasks = useMemo(() => events.flatMap((event) => (event.subtasks || []).map((task) => ({ ...task, eventName: event.name }))).filter((task) => eventFilter === 'all' || String(task.activity) === String(eventFilter)).filter((task) => statusFilter === 'done' ? task.status === 'done' : task.status !== 'done').sort((a, b) => Number(a.estimated_hours) - Number(b.estimated_hours)), [events, eventFilter, statusFilter])
  const hours = tasks.filter((task) => group(task) === 'hoy').reduce((sum, task) => sum + Number(task.estimated_hours || 0), 0)
  if (status === 'loading') return <div className="center-state"><LoadingSpinner /></div>
  if (status === 'error') return <div className="page"><div className="server-error">No pudimos cargar tus gestiones.</div></div>
  return <div className="page"><header className="page-header"><div><h1>Hoy - Panel de prioridades</h1><p>Organiza las gestiones importantes de tus eventos.</p></div></header><FilterBar events={events} eventFilter={eventFilter} statusFilter={statusFilter} onEventChange={setEventFilter} onStatusChange={setStatusFilter} /><PriorityBanner /><div className="capacity-line"><span>Carga diaria: {hours}h / 6h</span>{hours > 6 && <button className="text-button delete" onClick={() => setConflict(true)}>Resolver sobrecarga</button>}</div>{['vencidas', 'hoy', 'proximas', 'completadas'].map((section) => { const list = tasks.filter((task) => group(task) === section); return <section className="priority-section" key={section}><h2>{section === 'vencidas' ? 'Gestiones vencidas' : section === 'hoy' ? 'Hoy' : section === 'proximas' ? 'Próximas' : 'Completadas'} {section === 'vencidas' && <AlertCircle size={18} />}</h2><div className="task-grid">{list.map((task) => <div className={`today-task task-${section}`} key={task.id}><div className="task-heading"><span className="task-check">{task.status === 'done' && <Check size={14} />}</span><strong>{task.name}</strong><MoreVertical size={17} /></div><p>{task.eventName}</p><span>{task.estimated_hours}h · {task.due_date}</span></div>)}</div></section>})}{conflict && <ConflictModal hours={hours} onClose={() => setConflict(false)} />}</div>
}
