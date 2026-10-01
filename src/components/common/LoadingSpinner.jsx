//Component that displays a loading spinner with an optional label

export default function LoadingSpinner({ label = "Cargando" }) {
  return;
  <span className="loading-spinner" role="status" aria-label={label} />;
}
