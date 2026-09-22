import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../config/app";

export default function AdminRoute({
  children,
}) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/admin/session`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => { if (active) setState(data.authenticated ? "allowed" : "denied"); })
      .catch(() => { if (active) setState("denied"); });
    return () => { active = false; };
  }, []);

  if (state === "checking") {
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

  if (state !== "allowed") {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return children;
}
