const API_URL = (
	import.meta.env.VITE_API_URL ||
	'https://backend-miniproyectoi.onrender.com/api'
).replace(/\/+$/, '')

const request = async (path, options = {}) => {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		method: options.method || 'GET',
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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

export const eventServices = {
	listEvents: () => request('/actividades/'),
	getEvent: (id) => request(`/actividades/${id}/`),
	createEvent: (data) => request('/actividades/', { method: 'POST', body: JSON.stringify(data) }),
	updateActividad: (id, data) => request(`/actividades/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
	updateEvent: (id, data) => request(`/actividades/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
	deleteEvent: (id) => request(`/actividades/${id}/`, { method: 'DELETE' }),
	createSubtask: (data) => request('/subtareas/', { method: 'POST', body: JSON.stringify(data) }),
	updateSubtask: (id, data) => request(`/subtareas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
	deleteSubtask: (id) => request(`/subtareas/${id}/`, { method: 'DELETE' }),
	getProgress: (id) => request(`/actividades/${id}/progreso/`),
	getCapacity: (date, userId) => {
		const query = new URLSearchParams({ date, ...(userId ? { user_id: userId } : {}) })
		return request(`/capacidad-diaria/resumen/?${query}`)
	},
}
