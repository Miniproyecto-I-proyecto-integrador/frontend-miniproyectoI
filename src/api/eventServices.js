import { mockEvents } from './mockData'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://backend-miniproyectoi.onrender.com/api'
).replace(/\/+$/, '')
// Los mocks son opt-in; producción debe consumir la API aunque la variable no exista.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

const jsonRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.detail || 'No pudimos completar la solicitud')
    error.status = response.status
    error.fields = body
    throw error
  }
  return body
}

let mockStore = structuredClone(mockEvents)
const mockClone = () => structuredClone(mockStore)

export const eventServices = {
  async listEvents() {
    if (USE_MOCKS) return mockClone()
    return jsonRequest('/actividades/')
  },
  async getEvent(id) {
    if (USE_MOCKS) return mockClone().find((event) => String(event.id) === String(id)) || null
    return jsonRequest(`/actividades/${id}/`)
  },
  async createEvent(payload) {
    if (USE_MOCKS) { const event = { ...payload, id: `local-${Date.now()}`, progress: 0, subtasks: [] }; mockStore.push(event); return event }
    return jsonRequest('/actividades/', { method: 'POST', body: JSON.stringify(payload) })
  },
  async updateEvent(id, payload) {
    if (USE_MOCKS) { mockStore = mockStore.map((event) => String(event.id) === String(id) ? { ...event, ...payload } : event); return mockStore.find((event) => String(event.id) === String(id)) }
    return jsonRequest(`/actividades/${id}/`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  async deleteEvent(id) {
    if (USE_MOCKS) { mockStore = mockStore.filter((event) => String(event.id) !== String(id)); return true }
    return jsonRequest(`/actividades/${id}/`, { method: 'DELETE' })
  },
  async createSubtask(payload) {
    if (USE_MOCKS) { const task = { ...payload, id: `local-task-${Date.now()}` }; mockStore = mockStore.map((event) => String(event.id) === String(payload.activity) ? { ...event, subtasks: [...(event.subtasks || []), task] } : event); return task }
    return jsonRequest('/subtareas/', { method: 'POST', body: JSON.stringify(payload) })
  },
  async updateSubtask(id, payload) {
    if (USE_MOCKS) { mockStore = mockStore.map((event) => ({ ...event, subtasks: (event.subtasks || []).map((task) => String(task.id) === String(id) ? { ...task, ...payload } : task) })); return { ...payload, id } }
    return jsonRequest(`/subtareas/${id}/`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  async deleteSubtask(id) {
    if (USE_MOCKS) { mockStore = mockStore.map((event) => ({ ...event, subtasks: (event.subtasks || []).filter((task) => String(task.id) !== String(id)) })); return true }
    return jsonRequest(`/subtareas/${id}/`, { method: 'DELETE' })
  },
  async getProgress(id) {
    if (USE_MOCKS) {
      const event = mockClone().find((item) => String(item.id) === String(id))
      return { progress: event?.progress || 0, total_subtasks: event?.subtasks?.length || 0, completed_subtasks: event?.subtasks?.filter((item) => item.status === 'done').length || 0 }
    }
    return jsonRequest(`/actividades/${id}/progreso/`)
  },
  async getCapacity(date, userId) {
    if (USE_MOCKS) return { date, assigned_hours: 0, limit_hours: 6, overloaded: false }
    const query = new URLSearchParams({ date, ...(userId ? { user_id: userId } : {}) })
    return jsonRequest(`/capacidad-diaria/resumen/?${query}`)
  },
}
