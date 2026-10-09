import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Sidebar from "./components/common/Sidebar";
import HoyPage from "./pages/Hoy/HoyPage";
import EventosPage from "./pages/Eventos/EventosPage";
import EventDetailPage from "./pages/EventoDetail/EventDetailPage";
import CrearEventPage from "./pages/Crear/CrearEventPage";
import LoginPage from "./pages/Login/LoginPage.jsx";
import RegisterPage from "./pages/Registro/RegisterPage";
import "./App.css";

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<HoyPage />} />
          <Route
            path="/eventos"
            element={<EventosPage loadingMessage="Cargando tus eventos..." />}
          />
          <Route
            path="/progreso"
            element={<EventosPage loadingMessage="Cargando tu progreso..." />}
          />
          <Route path="/evento/:id" element={<EventDetailPage />} />
          <Route path="/crear" element={<CrearEventPage />} />
          <Route
            path="/configuracion"
            element={
              <div className="page">
                <h1>Configuración</h1>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
