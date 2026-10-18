import { AlertTriangle, CircleCheck, Info, X } from "lucide-react";

const styles = {
  success: { Icon: CircleCheck, accent: "var(--lux-mint)" },
  error: { Icon: AlertTriangle, accent: "#dc4b54" },
  info: { Icon: Info, accent: "var(--lux-violet)" },
};

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  const { Icon, accent } = styles[type] || styles.info;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className="shopora-toast"
      style={{ "--toast-accent": accent }}
    >
      <Icon size={18} className="shrink-0 text-[var(--toast-accent)]" />
      <p>{message}</p>
      <button type="button" onClick={onClose} aria-label="Close notification"><X size={16} /></button>
    </div>
  );
}
