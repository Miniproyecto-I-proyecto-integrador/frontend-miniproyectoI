import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Clock, Calendar, AlertCircle, CheckCircle2, Plus, LayoutDashboard,
  CalendarPlus, BarChart2, MoreVertical, Info, User, Check, Trash2,
  MapPin, Package
} from 'lucide-react';

/* ============================================================
   TEMA 
   ============================================================ */
const THEME = {
  bg: '#FFFFFF',
  bgElevated: '#FFFFFF',
  sidebarBg: '#F3F4F6',
  sidebarText: '#4B5563',
  sidebarTextActive: '#000000',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  accent: '#000000',
  
  vencidasBg: '#ffcfcf',
  vencidasBorder: '#ff9999',
  vencidasText: '#b91c1c',
  
  hoyBg: '#cfffcf',
  hoyBorder: '#66ff33',
  hoyText: '#15803d',
  
  proximasBg: '#cfdfff',
  proximasBorder: '#99b3ff',
  proximasText: '#1d4ed8',
  
  success: '#047857',
  successBg: '#d1fae5',
};

const FONT_DISPLAY = "system-ui, -apple-system, sans-serif";
const FONT_BODY = "system-ui, -apple-system, sans-serif";

/* ============================================================
   DATOS / UTILIDADES
   ============================================================ */
const STORE_KEY = 'logistiq_data_v2';

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function seedData() {
  const events = [
    { id: uid(), name: 'Boda de Ana y Carlos', type: 'Boda', date: addDaysISO(30), location: 'Hacienda El Paraíso' },
    { id: uid(), name: 'Cumpleaños 50', type: 'Cumpleaños', date: addDaysISO(2), location: 'Club Campestre' },
    { id: uid(), name: 'Feria Empresarial', type: 'Corporativo', date: addDaysISO(14), location: 'Centro de Eventos' },
  ];
  const tasks = [
    { id: uid(), name: 'Confirmar contrato', eventId: events[0].id, hours: 3, due: addDaysISO(-4), completed: false },
    { id: uid(), name: 'Revisar playlist', eventId: events[1].id, hours: 2, due: addDaysISO(-2), completed: false },
    { id: uid(), name: 'Llamar DJ', eventId: events[0].id, hours: 1, due: todayISO(), completed: false },
    { id: uid(), name: 'Confirmar decoración', eventId: events[0].id, hours: 3, due: todayISO(), completed: false },
    { id: uid(), name: 'Confirmar transporte', eventId: events[2].id, hours: 1, due: addDaysISO(2), completed: false },
    { id: uid(), name: 'Distribución mesas', eventId: events[0].id, hours: 3, due: addDaysISO(5), completed: false },
  ];
  return { events, tasks };
}

function loadInitialData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.events && parsed?.tasks) return parsed;
    }
  } catch (e) {
    console.warn('No se pudo leer almacenamiento local', e);
  }
  return seedData();
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatDate(iso) {
  if (iso === todayISO()) return 'Hoy';
  if (iso === addDaysISO(1)) return 'Mañana';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
function taskGroup(task) {
  if (task.completed) return 'completada';
  if (task.due < todayISO()) return 'vencidas';
  if (task.due === todayISO()) return 'hoy';
  return 'proximas';
}

function useLogistiqStore() {
  const [data, setData] = useState(loadInitialData);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar', e);
    }
  }, [data]);

  const addEvent = (event) => setData((d) => ({ ...d, events: [...d.events, { id: uid(), ...event }] }));
  const deleteEvent = (id) => setData((d) => ({ events: d.events.filter((e) => e.id !== id), tasks: d.tasks.filter((t) => t.eventId !== id) }));
  const addTask = (task) => setData((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), completed: false, ...task }] }));
  const deleteTask = (id) => setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  const toggleTask = (id) => setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)) }));

  return { ...data, addEvent, deleteEvent, addTask, deleteTask, toggleTask };
}

function groupTheme(group) {
  return {
    vencidas: { bg: THEME.vencidasBg, border: THEME.vencidasBorder, text: THEME.vencidasText },
    hoy: { bg: THEME.hoyBg, border: THEME.hoyBorder, text: THEME.hoyText },
    proximas: { bg: THEME.proximasBg, border: THEME.proximasBorder, text: THEME.proximasText },
    completada: { bg: THEME.successBg, border: THEME.success, text: THEME.success },
  }[group];
}

/* ============================================================
   COMPONENTE: TARJETA DE TAREA
   ============================================================ */
function CardTarea({ tarea, eventName, onToggle, onDelete, menuOpen, onToggleMenu }) {
  const group = taskGroup(tarea);
  const theme = groupTheme(group);

  return (
    <div style={{
      backgroundColor: theme.bg, border: `2px solid ${theme.border}`,
      borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
      position: 'relative', opacity: tarea.completed ? 0.6 : 1, color: THEME.textPrimary
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onToggle(tarea.id)}
            style={{
              width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${tarea.completed ? THEME.success : '#fff'}`,
              backgroundColor: tarea.completed ? THEME.success : 'transparent', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
            }}
          >
            {tarea.completed && <Check size={14} />}
          </button>
          <strong style={{ fontSize: '15px', textDecoration: tarea.completed ? 'line-through' : 'none' }}>
            {tarea.name}
          </strong>
        </div>
        <button onClick={() => onToggleMenu(tarea.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.textPrimary }}>
          <MoreVertical size={18} />
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '40px', right: '14px', background: THEME.bgElevated,
          border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 5
        }}>
          <button onClick={() => onDelete(tarea.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', width: '100%' }}>
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}

      <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '32px' }}>
        <Calendar size={14} /> {eventName || 'Evento eliminado'}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', marginLeft: '32px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
          <Clock size={14} /> {tarea.hours}h
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
          {tarea.completed ? 'Completada' : formatDate(tarea.due)}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE: ITEM DE NAVEGACIÓN
   ============================================================ */
function NavItem({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/hoy' && location.pathname === '/');

  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '24px',
      textDecoration: 'none', fontSize: '14px', fontWeight: 500,
      color: THEME.accent, backgroundColor: THEME.bgElevated,
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      border: `${isActive ? '2px' : '1px'} solid ${isActive ? THEME.accent : THEME.border}`,
      transition: 'all 0.15s ease',
    }}>
      <Icon size={18} />
      <span className="nav-label">{children}</span>
    </Link>
  );
}

/* ============================================================
   MODAL: NUEVA TAREA
   ============================================================ */
function ModalNuevaTarea({ events, onClose, onCreate, onGoToCrearEvento }) {
  const [name, setName] = useState('');
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [hours, setHours] = useState(1);
  const [due, setDue] = useState(todayISO());

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' };
  const modalStyle = { background: THEME.bgElevated, borderRadius: '16px', padding: '26px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' };
  const inputStyle = { fontFamily: FONT_BODY, fontSize: '14px', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', width: '100%' };

  if (events.length === 0) {
    return (
      <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={modalStyle}>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Primero crea un evento</h2>
          <p style={{ margin: '0 0 20px', color: THEME.textSecondary }}>Cada tarea necesita estar vinculada a un evento.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} style={btnGhost}>Cerrar</button>
            <button onClick={onGoToCrearEvento} style={btnPrimary}>Crear evento</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Nueva tarea</h2>
        <form onSubmit={(e) => { e.preventDefault(); onCreate({ name: name.trim(), eventId, hours: parseFloat(hours), due }); }}>
          <div style={{ marginBottom: '16px' }}><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Confirmar catering" required /></div>
          <div style={{ marginBottom: '16px' }}>
            <select style={inputStyle} value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
            <input style={{ ...inputStyle, flex: 1 }} type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" style={btnPrimary}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const btnPrimary = { background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const btnGhost = { background: 'transparent', color: THEME.textPrimary, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };

/* ============================================================
   VISTA: HOY (Sin el botón duplicado ni el modal)
   ============================================================ */
function Hoy({ store }) {
  const { events, tasks, toggleTask, deleteTask } = store;
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pendientes');
  const [menuOpenId, setMenuOpenId] = useState(null);

  const filtered = tasks.filter((t) => filterEvent === 'all' || t.eventId === filterEvent);
  const pending = filtered.filter((t) => !t.completed);
  
  const vencidas = pending.filter((t) => taskGroup(t) === 'vencidas');
  const hoy = pending.filter((t) => taskGroup(t) === 'hoy');
  const proximas = pending.filter((t) => taskGroup(t) === 'proximas');

  const maxHorasDia = 6;
  const horasHoy = hoy.reduce((a, t) => a + t.hours, 0);
  const overLoad = horasHoy > maxHorasDia;

  const renderGrid = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {list.map((t) => (
        <CardTarea key={t.id} tarea={t} eventName={events.find(e => e.id === t.eventId)?.name} onToggle={toggleTask} onDelete={(id) => { deleteTask(id); setMenuOpenId(null); }} menuOpen={menuOpenId === t.id} onToggleMenu={(id) => setMenuOpenId(menuOpenId === id ? null : id)} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700 }}>Hoy - Panel de prioridades</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} style={selectStyle}>
          <option value="all">Evento: Todos los eventos</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="pendientes">Estado: Pendientes</option>
          <option value="completadas">Estado: Completadas</option>
        </select>
      </div>

      <div style={{ backgroundColor: '#F3F4F6', border: `1px solid ${THEME.border}`, padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', fontSize: '14px' }}>
        <AlertCircle size={18} />
        <span>Tus tareas se ordenan por prioridad: primero vencidas, luego las de hoy y finalmente próximas.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
        {filterStatus === 'completadas' ? (
           <section>{renderGrid(filtered.filter(t => t.completed))}</section>
        ) : (
          <>
            {vencidas.length > 0 && (
              <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', margin: '0 0 16px' }}>
                  Gestiones vencidas <AlertCircle size={18} />
                </h3>
                {renderGrid(vencidas)}
              </section>
            )}
            
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', margin: 0 }}>Hoy, {new Date().getDate()} {MESES[new Date().getMonth()]}</h3>
                <span style={{ fontSize: '14px', color: overLoad ? THEME.vencidasText : THEME.textSecondary, fontWeight: 600 }}>
                  Carga diaria: {horasHoy}h / {maxHorasDia}h
                </span>
              </div>
              {renderGrid(hoy)}
            </section>

            <section>
              <h3 style={{ fontSize: '20px', margin: '0 0 16px' }}>Próximas</h3>
              {renderGrid(proximas)}
            </section>
          </>
        )}
      </div>

      <div style={{ marginTop: '40px', backgroundColor: '#F3F4F6', border: `1px solid ${THEME.border}`, padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '15px' }}>
        {pending.length} tareas pendientes - {hoy.length} para hoy
      </div>
    </div>
  );
}

const selectStyle = { padding: '10px 16px', borderRadius: '24px', border: `1px solid ${THEME.border}`, backgroundColor: THEME.bgElevated, fontSize: '14px', outline: 'none' };

/* ============================================================
   VISTA: EVENTOS / PROGRESO
   ============================================================ */
function CrearEvento({ store }) {
  return <div style={{ padding: '32px 40px' }}><h1 style={{ fontSize: '32px', margin: '0 0 24px' }}>Eventos</h1><p>Pantalla de gestión de eventos.</p></div>;
}
function Progreso({ store }) {
  return <div style={{ padding: '32px 40px' }}><h1 style={{ fontSize: '32px', margin: '0 0 24px' }}>Progreso</h1><p>Vista general heredada.</p></div>;
}

/* ============================================================
   APP PRINCIPAL (Con el layout y el modal global)
   ============================================================ */
function AppContent() {
  const store = useLogistiqStore();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: THEME.bg, fontFamily: FONT_BODY }}>
      
      <aside className="sidebar" style={{ width: '260px', flexShrink: 0, backgroundColor: THEME.sidebarBg, borderRight: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: THEME.accent, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Logistiq</div>
        </div>

        {/* Aquí está el botón izquierdo conectado al Modal */}
        <button 
          onClick={() => setModalOpen(true)}
          style={{ backgroundColor: THEME.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: '24px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '32px', width: '100%' }}
        >
          + Nueva tarea
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <NavItem to="/hoy" icon={LayoutDashboard}>Hoy</NavItem>
          <NavItem to="/crear" icon={CalendarPlus}>Eventos</NavItem>
          <NavItem to="/progreso" icon={BarChart2}>Progreso</NavItem>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer', marginTop: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>persona</span>
        </div>
      </aside>

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Hoy store={store} />} />
          <Route path="/hoy" element={<Hoy store={store} />} />
          <Route path="/crear" element={<CrearEvento store={store} />} />
          <Route path="/evento/:id" element={<div style={{ padding: 40 }}><h1>Detalle del Evento</h1><Link to="/hoy">← Volver a Hoy</Link></div>} />
          <Route path="/progreso" element={<Progreso store={store} />} />
          <Route path="/configuracion" element={<div style={{ padding: 40 }}><h1>Configuración de Horas</h1><Link to="/hoy">← Volver a Hoy</Link></div>} />
          <Route path="/login" element={<div style={{ padding: 40 }}><h1>Iniciar Sesión</h1></div>} />
        </Routes>
      </main>

      {/* El Modal ahora es global y cubre toda la pantalla */}
      {modalOpen && (
        <ModalNuevaTarea 
          events={store.events} 
          onClose={() => setModalOpen(false)} 
          onCreate={(task) => { store.addTask(task); setModalOpen(false); }} 
          onGoToCrearEvento={() => { setModalOpen(false); navigate('/crear'); }} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}