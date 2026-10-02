import { CheckCircle2 } from "lucide-react";
import { APP_NAME } from "../../../config.js";

// Logo + nombre de la empresa (lo usan el Sidebar y las páginas de login/registro)
export default function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <CheckCircle2 size={20} />
      </span>
      <strong>{APP_NAME}</strong>
    </div>
  );
}
