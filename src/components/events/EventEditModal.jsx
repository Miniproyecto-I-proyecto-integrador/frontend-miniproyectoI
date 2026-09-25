import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

const initialForm = (event) => ({
  user_id: event.user_id,
  name: event.name || '',
  date_event: event.date_event || '',
  event_type: event.event_type || '',
  location: event.location || '',
  client: event.client || '',
  description: event.description || '',
  status: event.status || 'active',
})

export default function EventEditModal({ event, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initialForm(event))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (submitEvent) => {
    submitEvent.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Este campo es obligatorio'
    if (!form.date_event) nextErrors.date_event = 'Este campo es obligatorio'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    setErrors({}); setServerError(''); setLoading(true)
    try { await onSubmit(form); onClose() } catch (error) { setServerError(error.message || 'No pudimos actualizar el evento, por favor reintenta') } finally { setLoading(false) }
  }
  const field = (label, name, type = 'text', placeholder = '') => <label className={`form-field ${errors[name] ? 'has-error' : ''}`}><span>{label}</span><input type={type} value={form[name]} placeholder={placeholder} disabled={loading} onChange={(inputEvent) => update(name, inputEvent.target.value)} />{errors[name] && <small>{errors[name]}</small>}</label>
  return <div className="modal-backdrop"><section className="modal subtask-modal" role="dialog" aria-modal="true" aria-labelledby="event-edit-title"><button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button><h2 id="event-edit-title">Editar evento</h2>{serverError && <div className="server-error"><AlertCircle size={18} /><span>{serverError}</span><button onClick={() => setServerError('')}>Reintentar</button></div>}<form onSubmit={submit}><div className="form-block"><h3>¿Qué evento estás organizando?</h3>{field('Nombre del evento*', 'name', 'text', 'Ej. Boda de Luis y Alejandra')}{field('Tipo de evento', 'event_type', 'text', 'Ej. Boda')}</div><div className="form-block"><h3>¿Cuándo y dónde será?</h3>{field('Fecha del evento*', 'date_event', 'date')}{field('Lugar', 'location', 'text', 'Ej. Club Campestre Cali')}</div><div className="form-block"><h3>¿Para quién es y qué debemos recordar?</h3>{field('Cliente', 'client', 'text', 'Nombre del cliente')}<label className="form-field"><span>Descripción</span><textarea value={form.description} disabled={loading} onChange={(inputEvent) => update('description', inputEvent.target.value)} /></label></div><div className="modal-actions"><button type="button" className="button button-neutral" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={loading}>{loading ? <LoadingSpinner /> : 'Guardar cambios'}</button></div></form></section></div>
}