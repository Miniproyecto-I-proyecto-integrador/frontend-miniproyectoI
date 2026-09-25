import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProgressBar from '../common/ProgressBar'

export default function EventCard({ event }) {
  return <article className="event-card"><div className="event-card-head"><div><h2>{event.name}</h2><p>{event.date_event}</p></div><span className="badge">{event.event_type || 'Evento'}</span></div><ProgressBar value={event.progress || 0} /><Link className="detail-link" to={`/evento/${event.id}`}> <ExternalLink size={16} /> ver detalle</Link></article>
}
