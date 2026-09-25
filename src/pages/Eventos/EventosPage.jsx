import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { eventServices } from '../../api/eventServices'
import EventCard from '../../components/events/EventCard'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function EventosPage() {
  const [events, setEvents] = useState([]); const [state, setState] = useState('loading'); const navigate = useNavigate()
  const load = async () => { setState('loading'); try { setEvents(await eventServices.listEvents()); setState('ready') } catch { setState('error') } }
  useEffect(() => { const timer = setTimeout(() => { void load() }, 0); return () => clearTimeout(timer) }, [])
  return <div className="page"><header className="page-header"><div><h1>Eventos</h1><p>Consulta el avance de tus eventos y gestiones.</p></div><button className="button button-primary" onClick={() => navigate('/crear')}><Plus size={17} /> Crear evento</button></header>{state === 'loading' && <div className="center-state"><LoadingSpinner /></div>}{state === 'error' && <ErrorState message="No pudimos cargar tus eventos, por favor reintenta." onRetry={load} />}{state === 'ready' && (events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState message="Aún no tienes eventos planificados. Crea un evento para ver su progreso" action="Crear evento" onAction={() => navigate('/crear')} />)}</div>
}
