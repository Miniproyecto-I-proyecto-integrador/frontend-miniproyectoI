import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authServices } from "../../api/authServices";
import AuthLayout from "../../components/common/AuthLayout";
import FormError from "../../components/common/FormError";
import FormField from "../../components/common/FormField";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SuccessModal from "../../components/common/SuccessModal";
import { useAuth } from "../../context/AuthContext";

const emailPattern = /^\S+@\S+\.\S+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [credentialsError, setCredentialsError] = useState(false); // marca ambos campos en rojo
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
      setSession(
        await authServices.login({
          email: form.email.trim(),
          password: form.password,
        }),
      );
    } catch (error) {
      if (error.status === 401) {
        setCredentialsError(true);
        setServerError("Correo electrónico o contraseña incorrectos");
      } else setServerError("No pudimos iniciar sesión, por favor reintenta");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (session.token) login(session); // con el backend real: guarda la sesión en el AuthProvider
    navigate("/hoy");
  };

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
          className="button button-primary auth-submit"
          disabled={loading}
        >
          {loading ? <LoadingSpinner /> : "Iniciar sesión"}
        </button>
      </form>

      {session && (
        <SuccessModal
          title="Inicio de sesión exitoso"
          actionLabel="Continuar"
          message={`Bienvenid@ de nuevo, ${session.user.first_name}. Ya puedes seguir organizando tus eventos`}
          onAccept={accept}
        />
      )}
    </AuthLayout>
  );
}
