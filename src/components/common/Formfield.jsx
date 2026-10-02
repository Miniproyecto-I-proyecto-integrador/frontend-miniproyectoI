// Campo de formulario con el mismo estilo de error que los demás formularios:
// borde rojo + texto rojo debajo. "invalid" permite marcar el borde sin mostrar texto.
export default function FormField({
  label,
  error,
  invalid = Boolean(error),
  ...inputProps
}) {
  return (
    <label className={`form-field ${invalid ? "has-error" : ""}`}>
      <span>{label}</span>
      <input {...inputProps} />
      {error && <small>{error}</small>}
    </label>
  );
}
