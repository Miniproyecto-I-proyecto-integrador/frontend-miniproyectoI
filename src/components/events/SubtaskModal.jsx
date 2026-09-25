import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

const empty = { name: '', category: '', due_date: '', scheduled_date: '', estimated_hours: '', contact: '', description: '', status: 'pending' }
export default function SubtaskModal({ activityId, eventDate, task, onClose, onSubmit }) {
  const [form, setForm] = useState(task ? { ...empty, ...task } : { ...empty, due_date: eventDate, scheduled_date: eventDate })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Este campo es obligatorio'
    if (!form.due_date) next.due_date = 'Este campo es obligatorio'
    if (form.due_date && eventDate && form.due_date > eventDate) next.due_date = 'el plazo de la subtarea no puede ser posterior a la fecha del evento'
    if (!form.estimated_hours || Number(form.estimated_hours) <= 0) next.estimated_hours = 'Las horas estimadas deben ser mayores a cero'
    if (Object.keys(next).length) { setErrors(next); return }
    setErrors({}); setServerError(''); setLoading(true)
    try { await onSubmit({ ...form, activity: activityId, estimated_hours: Number(form.estimated_hours) }); onClose() } catch (error) { setServerError(error.message || 'No pudimos guardar la subtarea, por favor reintenta') } finally { setLoading(false) }
  }
  const field = (label, name, type = 'text', placeholder = '') => <label className={`form-field ${errors[name] ? 'has-error' : ''}`}><span>{label}</span><input type={type} value={form[name] || ''} placeholder={placeholder} disabled={loading} onChange={(event) => update(name, event.target.value)} />{errors[name] && <small>{errors[name]}</small>}</label>
  return <div className="modal-backdrop"><section className="modal subtask-modal" role="dialog" aria-modal="true" aria-labelledby="subtask-title"><button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button><h2 id="subtask-title">{task ? 'Editar subtarea' : 'Crear subtarea'}</h2>{serverError && <div className="server-error"><AlertCircle size={18} />{serverError}<button onClick={() => setServerError('')}>Reintentar</button></div>}<form onSubmit={submit}><div className="form-block"><h3>¿Qué gestión necesitas hacer?</h3>{field('Nombre de la subtarea*', 'name', 'text', 'Ej. Catering')}{field('Categoría', 'category', 'text', 'ej:')}</div><div className="form-block"><h3>¿Cuándo debe estar lista y cuánto tiempo te tomará?</h3>{field('plazo límite*', 'due_date', 'date')}{field('horas estimadas*', 'estimated_hours', 'number', '1.5 horas')}{field('fecha programada', 'scheduled_date', 'date')}</div><div className="form-block"><h3>¿Tiene proveedor?</h3>{field('Contacto', 'contact', 'text', 'Nombre o teléfono')}</div><div className="form-block"><h3>Escribe aquí los detalles que quieres guardar de la subtarea</h3><label className="form-field"><span>Descripción</span><textarea value={form.description || ''} placeholder="Ej. Club Campestre Cali" disabled={loading} onChange={(event) => update('description', event.target.value)} /></label></div><div className="modal-actions"><button type="button" className="button button-neutral" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={loading}>{loading ? <LoadingSpinner /> : task ? 'Guardar cambios' : 'Crear subtarea'}</button></div></form></section></div>
}
