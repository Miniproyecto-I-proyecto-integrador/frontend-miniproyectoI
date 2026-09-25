import { Pencil, Trash2 } from 'lucide-react'

const statusLabels = { pending: 'Pendiente', in_progress: 'En curso', postponed: 'Pospuesta', done: 'Terminada' }
export default function SubtaskRow({ task, onEdit, onDelete }) {
  return <article className="subtask-row"><div className="subtask-main"><div className="subtask-title"><h3>{task.name}</h3><span className="badge">{task.category || 'Logística'}</span><span className={`status status-${task.status}`}>{statusLabels[task.status] || task.status}</span></div><div className="subtask-details"><span>plazo límite: <b>{task.due_date}</b></span><span>horas estimadas: <b>{task.estimated_hours}h</b></span><span>descripción: <b>{task.description || 'Sin descripción'}</b></span></div></div><div className="row-actions"><button className="text-button edit" onClick={() => onEdit(task)}><Pencil size={14} /> editar</button><button className="text-button delete" onClick={() => onDelete(task)}><Trash2 size={14} /> borrar</button></div></article>
}
