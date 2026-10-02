import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authServices } from "../../api/authServices";
import AuthLayout from "../../components/common/AuthLayout";
import FormError from "../../components/common/FormError";
import FormField from "../../components/common/FormField";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SuccessModal from "../../components/common/SuccessModal";

const emailPattern = /^\S+@\S+\.\S+$/;
const initialForm = { first_name: "", last_name: "", email: "", password: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.first_name.trim()) next.first_name = "Este campo es obligatorio";
    if (!form.last_name.trim()) next.last_name = "Este campo es obligatorio";
    if (!form.email.trim()) next.email = "Este campo es obligatorio";
    else if (!emailPattern.test(form.email.trim()))
      next.email = "Ingresa un correo electrónico válido";
    if (!form.password) next.password = "Este campo es obligatorio";
    else if (form.password.length < 8)
      next.password = "La contraseña debe tener mínimo 8 caracteres";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setServerError("");
    try {
      await authServices.register({ ...form, email: form.email.trim() });
      setCreated(true);
    } catch {
      setServerError("No pudimos crear tu cuenta, por favor reintenta");
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, props = {}) => (
    <FormField
      label={label}
      value={form[name]}
      error={errors[name]}
      disabled={loading}
      onChange={(e) => update(name, e.target.value)}
      {...props}
    />
  );

  return (
    <AuthLayout description="Para poder registrarte y organizar tus eventos debes completar la siguiente información">
      <form className="auth-form" onSubmit={submit} noValidate>
        <h2>¿Cómo es tu nombre?</h2>
        <div className="auth-grid">
          {field("Nombres*", "first_name", {
            autoComplete: "given-name",
            placeholder: "Ej. Alejandro",
          })}
          {field("Apellidos*", "last_name", {
            autoComplete: "family-name",
            placeholder: "Ej. Grisales",
          })}
        </div>

        <h2>Tu información para ingresar</h2>
        <div className="auth-grid">
          {field("Correo electrónico*", "email", {
            type: "email",
            autoComplete: "email",
            placeholder: "Debe contener @ para ser válido",
          })}
          {field("Contraseña*", "password", {
            type: "password",
            autoComplete: "new-password",
            placeholder: "Mínimo 8 caracteres",
          })}
        </div>

        {serverError && <FormError message={serverError} />}
        <div className="auth-grid auth-actions">
          <button className="button button-primary" disabled={loading}>
            {loading ? <LoadingSpinner /> : "Confirmar"}
          </button>
          <button
            type="button"
            className="button button-cancel"
            disabled={loading}
            onClick={() => navigate("/login")}
          >
            Cancelar
          </button>
        </div>
      </form>

      {created && (
        <SuccessModal
          title="¡Registro exitoso!"
          actionLabel="Continuar"
          message="Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión"
          onAccept={() => navigate("/login")}
        />
      )}
    </AuthLayout>
  );
}
