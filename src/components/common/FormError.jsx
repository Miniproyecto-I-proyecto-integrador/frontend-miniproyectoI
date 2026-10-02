export default function FormError({ message }) {
  return (
    <div className="form-error" role="alert">
      <span className="form-error-icon">!</span>
      <span>{message}</span>
    </div>
  );
}
