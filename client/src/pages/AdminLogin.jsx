import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/app";
import ThemeToggle from "../components/ThemeToggle";
import { BrandMark } from "../components/BrandLogo";
import ShoporaAmbientBackground from "../components/ShoporaAmbientBackground";
import ShoporaLoader from "../components/ShoporaLoader";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#08090b] px-4 py-10 text-[var(--lux-ink)]">
      <ShoporaAmbientBackground />
      <div className="absolute right-5 top-5 z-20"><ThemeToggle /></div>
      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--lux-surface)] shadow-2xl shadow-black/35 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#0a0b0d] lg:block">
          <img src="/campaign/premium-gym.jpg" alt="Modern fitness operations space" className="shopora-image-reveal absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,6,8,.96),rgba(5,6,8,.16)_68%)]" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="lux-eyebrow text-white/45">Shopora control room</p>
            <h2 className="font-heading mt-3 max-w-md text-4xl font-extrabold leading-tight">Operate inventory, customers and revenue with clarity.</h2>
            <p className="mt-5 flex items-center gap-2 text-xs text-white/55"><ShieldCheck size={15} className="text-[var(--lux-mint)]" />Server-protected administrative session</p>
          </div>
        </div>

        <div className="flex items-center p-7 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3"><BrandMark size={42} /><span><strong className="font-heading block text-xl font-extrabold">Shopora</strong><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--lux-muted)]">Admin operations</span></span></button>
            <h1 className="font-heading mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--lux-muted)]">Use the private credentials configured on the Shopora server.</p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block text-sm font-semibold">Admin Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 outline-none transition focus:border-[var(--lux-violet)] focus:ring-4 focus:ring-violet-500/10" /></label>
              <label className="block text-sm font-semibold">Admin Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 pr-12 outline-none transition focus:border-[var(--lux-violet)] focus:ring-4 focus:ring-violet-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-2 grid w-10 place-items-center text-[var(--lux-muted)] transition hover:text-[var(--lux-ink)]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
              {error && <p role="alert" className="shopora-error-shake rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-600">{error}</p>}
              <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--lux-ink)] px-5 text-sm font-bold text-[var(--lux-bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <ShoporaLoader label="Signing in securely" size={18} /> : "Sign in to Admin"}</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
