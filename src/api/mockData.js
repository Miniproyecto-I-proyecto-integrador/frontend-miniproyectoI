const today = new Date().toISOString().slice(0, 10)

export const mockEvents = [
  {
    id: 'mock-1', name: 'Boda de Luis y Alejandra', event_type: 'Boda', date_event: '2026-10-05',
    location: 'Club Campestre Cali', client: 'Luis y Alejandra', description: 'Celebración principal.',
    progress: 60, subtasks: [
      { id: 'task-1', activity: 'mock-1', name: 'Confirmar catering', category: 'Catering', contact: 'Club Campestre', due_date: '2026-09-28', scheduled_date: today, estimated_hours: '2.0', status: 'done', description: 'Menú y montaje.' },
      { id: 'task-2', activity: 'mock-1', name: 'Coordinar música', category: 'Producción', contact: 'DJ Carlos', due_date: '2026-09-30', scheduled_date: today, estimated_hours: '3.0', status: 'in_progress', description: 'Revisar repertorio.' },
    ],
  },
  {
    id: 'mock-2', name: 'Fiesta de cumpleaños', event_type: 'Fiesta de cumpleaños', date_event: '2026-11-12',
    location: 'Casa familiar', client: 'María', description: 'Cumpleaños número 50.', progress: 0, subtasks: [],
  },
]

export const emptyMockEvents = []
