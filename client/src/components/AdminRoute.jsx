import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { useAdminAccess } from "../auth/useAdminAccess";

export default function AdminRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  const {
    checking,
    allowed,
  } = useAdminAccess();

  if (loading || (user && checking)) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-950 dark:border-slate-700 dark:border-t-white" />

          <p className="mt-3 text-sm text-stone-500 dark:text-slate-400">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
      />
    );
  }

  if (!allowed) {
    return (
      <Navigate
        to="/home"
        replace
      />
    );
  }

  return children;
}
