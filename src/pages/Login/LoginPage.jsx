import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { authServices } from "../../api/authServices";
import AuthLayout from "../../components/common/AuthLayout";
import FormError from "../../components/common/FormError";
import FormField from "../../components/common/Formfield";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SuccessModal from "../../components/common/SuccessModal";
import { useAuth } from "../../context/AuthContext";

const emailPattern = /^\S+@\S+\.\S+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [credentialsError, setCredentialsError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setCredentialsError(false);
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Este campo es obligatorio";
    else if (!emailPattern.test(form.email.trim()))
      next.email = "Ingresa un correo electrónico válido";
    if (!form.password) next.password = "Este campo es obligatorio";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError("");
    setCredentialsError(false);

    try {
      const nextSession = await authServices.login({
        email: form.email.trim(),
        password: form.password,
      });
      setSession(nextSession);
    } catch (error) {
      if ([400, 401].includes(error.status)) {
        setCredentialsError(true);
        setServerError("Correo electrónico o contraseña incorrectos");
      } else {
        setServerError("No pudimos iniciar sesión, por favor reintenta");
      }
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!session?.token) return;

    login(session);
    const destination = location.state?.from?.pathname || "/hoy";
    navigate(destination, { replace: true });
  };

  if (isAuthenticated && !session) {
    return <Navigate to="/hoy" replace />;
  }

  return (
    <AuthLayout description="Inicia sesión con tu correo electrónico y contraseña, si no tienes cuenta dale clic a “Registrarse”">
      <form className="auth-form login-form" onSubmit={submit} noValidate>
        <FormField
          label="Correo electrónico*"
          type="email"
          autoComplete="email"
          placeholder="Debe contener @ para ser válido"
          value={form.email}
          error={errors.email}
          invalid={Boolean(errors.email) || credentialsError}
          disabled={loading}
          onChange={(e) => update("email", e.target.value)}
        />
        <FormField
          label="Contraseña*"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={form.password}
          error={errors.password}
          invalid={Boolean(errors.password) || credentialsError}
          disabled={loading}
          onChange={(e) => update("password", e.target.value)}
        />

        {serverError && <FormError message={serverError} />}
        <button
          type="submit"
          className="button button-primary auth-submit"
          disabled={loading}
        >
          {loading ? <LoadingSpinner /> : "Iniciar sesión"}
        </button>
      </form>

      {session && (
        <SuccessModal
          title="Inicio de sesión exitoso"
          message={`Bienvenid@ de nuevo, ${session.user.first_name}. Ya puedes seguir organizando tus eventos`}
          onAccept={accept}
        />
      )}
    </AuthLayout>
  );
}
