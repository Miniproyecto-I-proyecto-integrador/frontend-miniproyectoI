import { Check } from "lucide-react";
import { NavLink } from "react-router-dom";
import Brand from "../common/Brand";
import { APP_NAME } from "../../../config";

// Estructura común de login y registro: imagen | panel con logo, selector, saludo, descripción y formulario
export default function AuthLayout({ description, children }) {
  const tab = ({ isActive }) => `auth-tab ${isActive ? "active" : ""}`;
  return (
    <div className="auth-page">
      {/* Espacio reservado para la imagen: ver .auth-image en App.css */}
      <div className="auth-image" aria-hidden="true" />
      <main className="auth-panel">
        <div className="auth-brand">
          <Brand />
        </div>
        <div className="auth-content">
          <h1 className="auth-title">Bienvenido a {APP_NAME}</h1>

          <p className="auth-description">{description}</p>

          <nav className="auth-tabs" aria-label="Acceso">
            <NavLink to="/login" className={tab}>
              {({ isActive }) => (
                <>{isActive && <Check size={14} />} Iniciar sesión</>
              )}
            </NavLink>

            <NavLink to="/registro" className={tab}>
              {({ isActive }) => (
                <>{isActive && <Check size={14} />} Registrarse</>
              )}
            </NavLink>
          </nav>

          {children}
        </div>
      </main>
    </div>
  );
}
