import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import DailyLimitPopover from "./DailyLimitPopover";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["/hoy", LayoutDashboard, "Hoy"],
  ["/eventos", CalendarDays, "Eventos"],
  ["/progreso", BarChart3, "Progreso"],
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLimitPopover, setShowLimitPopover] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.email ||
    "Usuario";

  return (
    <aside className="sidebar">
      <Brand />
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

      <div className="sidebar-footer">
        <div className="limit-trigger-wrapper">
          <button
            type="button"
            className="limit-toggle-button"
            onClick={() => setShowLimitPopover((prev) => !prev)}
          >
            <Settings size={18} />
            <span>Límite diario</span>
          </button>

          <DailyLimitPopover
            isOpen={showLimitPopover}
            onClose={() => setShowLimitPopover(false)}
          />
        </div>

        <div className="sidebar-user">
          <span className="user-icon">
            <User size={16} />
          </span>

          <div className="user-info">
            <span className="user-name">{displayName}</span>

            <button
              type="button"
              className="logout-button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
