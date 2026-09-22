import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/app";
import ThemeToggle from "../components/ThemeToggle";
import { BrandMark } from "../components/BrandLogo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your admin email and password.");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Invalid admin credentials");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--lux-bg)] px-4 py-10 text-[var(--lux-ink)]">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <section className="w-full max-w-md rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-7 shadow-xl sm:p-9">
        <div className="flex items-center gap-3"><BrandMark size={40} /><div><h1 className="font-heading text-2xl font-extrabold">Shopora Admin</h1><p className="text-xs text-[var(--lux-muted)]">Secure operations access</p></div></div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">Admin Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 outline-none focus:border-indigo-500" /></label>
          <label className="block text-sm font-semibold">Admin Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 pr-16 outline-none focus:border-indigo-500" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 text-xs font-bold text-[var(--lux-muted)]">{showPassword ? "Hide" : "Show"}</button></div></label>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <button disabled={loading} className="h-12 w-full rounded-xl bg-[var(--lux-ink)] text-sm font-bold text-[var(--lux-bg)] disabled:opacity-60">{loading ? "Signing in..." : "Sign in to Admin"}</button>
        </form>
      </section>
    </main>
  );
}
