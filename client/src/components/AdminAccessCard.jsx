import { useAdminAccess } from "../auth/useAdminAccess";

export default function AdminAccessCard() {
  const {
    checking,
    allowed,
    role,
    details,
  } = useAdminAccess();

  return (
    <section className="shopora-premium-card rounded-3xl p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            Backend authorization
          </p>

          <h2 className="font-heading mt-1 text-lg font-extrabold text-stone-950 dark:text-white">
            Admin access status
          </h2>

          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
            {checking
              ? "Checking the server…"
              : allowed
                ? "The server verified this Firebase UID as an administrator."
                : "This session is not authorized for admin APIs."}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
            allowed
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {checking
            ? "Checking"
            : allowed
              ? role
              : "Denied"}
        </span>
      </div>

      {allowed && details && (
        <div className="mt-4 grid gap-3 border-t border-stone-200 pt-4 text-xs dark:border-slate-800 sm:grid-cols-3">
          <div>
            <p className="text-stone-400">Email</p>
            <p className="mt-1 truncate font-semibold">
              {details.email || "—"}
            </p>
          </div>

          <div>
            <p className="text-stone-400">UID</p>
            <p className="mt-1 font-mono font-semibold">
              …{String(details.uid || "").slice(-10)}
            </p>
          </div>

          <div>
            <p className="text-stone-400">Provider</p>
            <p className="mt-1 font-semibold">
              {details.provider || "Firebase"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
