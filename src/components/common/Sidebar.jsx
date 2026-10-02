import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

//Component that displays a sidebar with navigation links and user information

const links = [
  ["/hoy", LayoutDashboard, "Hoy"],
  ["/eventos", CalendarDays, "Eventos"],
  ["/progreso", BarChart3, "Progreso"],
  ["/configuracion", Settings, "Configuración"],
];

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <CheckCircle2 size={20} />
        </span>
        <strong>Logística</strong>
      </div>
      <button
        className="new-event-button"
        aria-label="Nuevo evento"
        onClick={() => navigate("/crear")}
      >
        <Plus size={18} /> <span>Nuevo evento</span>
      </button>
      <nav className="sidebar-nav" aria-label="Navegación principal">
        {links.map(([to, Icon, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="user-icon">
          <User size={16} />
        </span>
        <span>persona</span>
      </div>
    </aside>
  );
}
