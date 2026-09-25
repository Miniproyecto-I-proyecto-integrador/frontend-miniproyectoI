import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { eventServices } from '../../api/eventServices'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ProgressBar from '../../components/common/ProgressBar'
import RiskModal from '../../components/common/RiskModal'
import SubtaskModal from '../../components/events/SubtaskModal'
import SubtaskRow from '../../components/events/SubtaskRow'
import EventEditModal from '../../components/events/EventEditModal'

export default function EventDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()
	const [event, setEvent] = useState(null)
	const [state, setState] = useState('loading')
	const [modal, setModal] = useState(null)
	const [error, setError] = useState('')

	const load = useCallback(async () => {
		setState('loading')
		try {
			const data = await eventServices.getEvent(id)
			if (!data) { setState('missing'); return }
			setEvent(data); setState('ready')
		} catch { setState('error') }
	}, [id])

	useEffect(() => { const timer = setTimeout(() => { void load() }, 0); return () => clearTimeout(timer) }, [load])

	const saveEvent = async (payload) => { const updated = await eventServices.updateActividad(id, payload); setEvent((current) => ({ ...current, ...updated })); setModal(null) }
	const saveTask = async (payload) => { if (modal?.task) await eventServices.updateSubtask(modal.task.id, payload); else await eventServices.createSubtask(payload); setModal(null); await load() }
	const removeTask = async () => { try { await eventServices.deleteSubtask(modal.task.id); setModal(null); await load() } catch (deleteError) { setError(deleteError.message) } }
	const removeEvent = async () => { try { await eventServices.deleteEvent(id); navigate('/eventos') } catch (deleteError) { setError(deleteError.message) } }

	if (state === 'loading') return <div className="center-state"><LoadingSpinner /></div>
	if (state === 'error') return <div className="page"><ErrorState message="No pudimos cargar el evento, por favor reintenta." onRetry={load} /></div>
	if (state === 'missing') return <div className="page"><ErrorState message="Evento no encontrado, por favor reintenta." onRetry={() => navigate('/eventos')} action="Volver a eventos" /></div>
	const progress = event.progress ?? (event.subtasks?.length ? Math.round(event.subtasks.filter((task) => task.status === 'done').length / event.subtasks.length * 100) : 0)
	return <div className="page"><header className="detail-header"><h1>Detalle del evento</h1><Link to="/eventos"><ArrowLeft size={16} /> volver a eventos</Link></header>{error && <div className="server-error">{error}</div>}<section className="event-detail-card"><div className="detail-card-top"><div><h2>{event.name}</h2><div className="detail-badges"><span className="badge">{event.date_event}</span><span className="badge">{event.event_type || 'Evento'}</span></div></div><div className="row-actions"><button className="text-button edit" onClick={() => setModal({ type: 'event-edit' })}><Pencil size={14} /> editar</button><button className="text-button delete" onClick={() => setModal({ type: 'event-delete' })}><Trash2 size={14} /> borrar</button></div></div><div className="event-facts"><span>lugar: <b>{event.location || 'Sin definir'}</b></span><span>cliente: <b>{event.client || 'Sin definir'}</b></span><span>descripción: <b>{event.description || 'Sin descripción'}</b></span><span>plazo límite: <b>{event.date_event}</b></span></div><ProgressBar value={progress} large /></section><section className="subtasks-section"><div className="section-heading"><h2>Subtareas logísticas:</h2><button className="button button-primary" onClick={() => setModal({ type: 'task-form' })}><Plus size={17} /> Crear subtarea</button></div>{!event.subtasks?.length && <EmptyState message="Este evento aún no tiene subtareas logísticas. Crea una nueva subtarea aquí." action="Crear subtarea" onAction={() => setModal({ type: 'task-form' })} />}{event.subtasks?.map((task) => <SubtaskRow key={task.id} task={task} onEdit={(item) => setModal({ type: 'task-form', task: item })} onDelete={(item) => setModal({ type: 'task-delete', task: item })} />)}</section>{modal?.type === 'event-edit' && <EventEditModal event={event} onClose={() => setModal(null)} onSubmit={saveEvent} />}{modal?.type === 'task-form' && <SubtaskModal key={modal.task?.id || 'new'} activityId={id} eventDate={event.date_event} task={modal.task} onClose={() => setModal(null)} onSubmit={saveTask} />}{modal?.type === 'task-delete' && <RiskModal title="¿Eliminar esta subtarea?" message="Esta acción no se puede deshacer." onCancel={() => setModal(null)} onConfirm={removeTask} />}{modal?.type === 'event-delete' && <RiskModal title="¿Eliminar este evento?" message="También se eliminarán sus subtareas logísticas." onCancel={() => setModal(null)} onConfirm={removeEvent} />}</div>
}
