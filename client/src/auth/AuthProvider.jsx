import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/app";
import { AuthContext } from "./AuthContext";

async function readJson(response) {
  return response.json().catch(() => ({}));
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async ({ refresh = true } = {}) => {
    let response = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
    if (response.status === 401 && refresh) {
      const refreshed = await fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" });
      if (refreshed.ok) response = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
    }
    if (!response.ok) {
      setUser(null);
      return null;
    }
    const data = await readJson(response);
    setUser(data.user || null);
    return data.user || null;
  }, []);

  useEffect(() => {
    let active = true;
    loadMe().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadMe]);

  const submit = useCallback(async (endpoint, payload) => {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || "Authentication failed");
    setUser(data.user || null);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    authenticated: Boolean(user),
    login: (payload) => submit("login", payload),
    register: (payload) => submit("register", payload),
    logout,
    refresh: loadMe,
    loginWithGoogle: () => { window.location.assign(`${API_URL}/api/auth/google`); },
    loginWithGitHub: () => { window.location.assign(`${API_URL}/api/auth/github`); },
  }), [loadMe, loading, logout, submit, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
