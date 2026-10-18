import { createElement } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminAccess } from "../auth/useAdminAccess";
import ShoporaLoader from "./ShoporaLoader";

export default function AdminAccessCard() {
  const { checking, allowed, details } = useAdminAccess();
  const StatusIcon = allowed ? ShieldCheck : ShieldAlert;

  return (
    <section className={`admin-access-strip ${allowed ? "is-authorized" : ""}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="admin-access-icon">
          {checking ? <ShoporaLoader label="" size={18} /> : createElement(StatusIcon, { size: 18, strokeWidth: 1.8 })}
        </span>
        <div className="min-w-0">
          <p className="lux-eyebrow">Backend authorization</p>
          <p className="mt-1 truncate text-sm font-bold text-[var(--lux-ink)]">
            {checking ? "Verifying admin session" : allowed ? "Secure admin session active" : "Admin API access unavailable"}
          </p>
        </div>
      </div>

      <div className="admin-access-meta">
        {allowed && details && <span>{details.email || "Admin"}</span>}
        {allowed && details && <span>{details.provider === "admin-session" ? "Environment session" : "Firebase Admin"}</span>}
        <strong>{checking ? "Checking" : allowed ? "Authorized" : "Denied"}</strong>
      </div>
    </section>
  );
}
