import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { APP_NAME, APP_TAGLINE } from "../config/app";
import { BrandMark } from "../components/BrandLogo";
import ShoporaAmbientBackground from "../components/ShoporaAmbientBackground";
import ShoporaLoader from "../components/ShoporaLoader";

const EMPTY_FORM = { name: "", username: "", email: "", identifier: "", password: "", confirm: "" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.9A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.6a6 6 0 0 1 0-3.2V7.5H3a10 10 0 0 0 0 9l3.4-2.9Z" />
      <path fill="#EA4335" d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3 7.5l3.4 2.9C7.2 8 9.4 6.2 12 6.2Z" />
    </svg>
  );
}

function GithubIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C14.8 4.9 15.8 5.2 15.8 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.4 5.7.4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .7Z" /></svg>;
}

function Field({ label, passwordToggle, showPassword, onTogglePassword, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--lux-muted)]">{label}</span>
      <span className="relative mt-1.5 block">
        <input {...props} className="h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 pr-12 text-sm text-[var(--lux-ink)] outline-none transition placeholder:text-stone-400 focus-visible:border-[var(--lux-violet)] focus-visible:ring-4 focus-visible:ring-violet-500/10" />
        {passwordToggle && (
          <button type="button" onClick={onTogglePassword} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--lux-muted)] hover:bg-[var(--lux-soft)]">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </label>
  );
}

export default function Authentication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, login, register, loginWithGoogle, loginWithGitHub } = useAuth();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(searchParams.get("error") || "");
  const signingUp = mode === "signup";

  useEffect(() => { document.title = `Sign in | ${APP_NAME}`; }, []);
  useEffect(() => { if (!authLoading && user) navigate("/home", { replace: true }); }, [authLoading, navigate, user]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const changeMode = (next) => { setMode(next); setForm(EMPTY_FORM); setError(""); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (signingUp && form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      if (signingUp) await register({ name: form.name, username: form.username, email: form.email, password: form.password });
      else await login({ identifier: form.identifier, password: form.password });
      navigate("/home", { replace: true });
    } catch (authError) {
      setError(authError.message || "Sign-in could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const beginProvider = (provider) => {
    setError("");
    setProviderLoading(provider);
    if (provider === "google") loginWithGoogle();
    else loginWithGitHub();
  };

  return (
    <div className="shopora-auth-page relative min-h-screen overflow-hidden bg-[#08090b] px-4 py-8 text-[var(--lux-ink)] sm:py-12">
      <ShoporaAmbientBackground />
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--lux-surface)] shadow-2xl shadow-black/30 lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <img src="/campaign/hero-dark-gym.jpg" alt="Shopora training space" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,6,8,.5),rgba(5,6,8,.96))]" />
          <button type="button" onClick={() => navigate("/")} className="relative inline-flex items-center gap-3 self-start"><BrandMark size={40} /><span className="font-heading text-xl font-extrabold">Shopora</span></button>
          <div className="relative">
            <p className="lux-eyebrow text-white/55">ONE SHOPORA IDENTITY</p>
            <h1 className="mt-4 max-w-sm font-heading text-5xl font-extrabold leading-[.98]">Train better.<br />Shop smarter.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-stone-300">Secure access to your store, orders, membership, rewards and training tools.</p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <p className="lux-eyebrow">{APP_TAGLINE}</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold">{signingUp ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-sm text-[var(--lux-muted)]">{signingUp ? "Create one secure Shopora identity." : "Sign in to continue your Shopora routine."}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={Boolean(providerLoading)} onClick={() => beginProvider("google")} className="shopora-button-press flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-bg)] px-4 text-sm font-bold hover:bg-[var(--lux-soft)] disabled:opacity-50">
                {providerLoading === "google" ? <ShoporaLoader label="Redirecting" size={17} /> : <><GoogleIcon />Google</>}
              </button>
              <button type="button" disabled={Boolean(providerLoading)} onClick={() => beginProvider("github")} className="shopora-button-press flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-ink)] px-4 text-sm font-bold text-[var(--lux-bg)] disabled:opacity-50">
                {providerLoading === "github" ? <ShoporaLoader label="Redirecting" size={17} /> : <><GithubIcon />GitHub</>}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--lux-line)]" /><span className="lux-eyebrow">OR</span><span className="h-px flex-1 bg-[var(--lux-line)]" /></div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-[var(--lux-soft)] p-1">
              <button type="button" onClick={() => changeMode("signin")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${!signingUp ? "bg-[var(--lux-surface)] shadow-sm" : "text-[var(--lux-muted)]"}`}>Sign in</button>
              <button type="button" onClick={() => changeMode("signup")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${signingUp ? "bg-[var(--lux-surface)] shadow-sm" : "text-[var(--lux-muted)]"}`}>Register</button>
            </div>

            {error && <div role="alert" className="shopora-error-shake mb-5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {signingUp ? <>
                <Field label="Name" autoComplete="name" value={form.name} onChange={(event) => setField("name", event.target.value)} required />
                <Field label="Username" autoComplete="username" value={form.username} onChange={(event) => setField("username", event.target.value)} required />
                <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(event) => setField("email", event.target.value)} required />
              </> : <Field label="Email / Username" autoComplete="username" value={form.identifier} onChange={(event) => setField("identifier", event.target.value)} required />}
              <Field label="Password" type={showPassword ? "text" : "password"} autoComplete={signingUp ? "new-password" : "current-password"} value={form.password} onChange={(event) => setField("password", event.target.value)} passwordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword((value) => !value)} required />
              {signingUp && <Field label="Confirm password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={(event) => setField("confirm", event.target.value)} required />}
              <button type="submit" disabled={loading || Boolean(providerLoading)} className="shopora-button-press flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--lux-orange)] px-5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50">
                {loading ? <ShoporaLoader label="Securing your session" size={18} /> : signingUp ? "Create Shopora account" : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-xs leading-5 text-[var(--lux-muted)]">Passwords use one-way bcrypt hashing. Shopora sessions stay in secure HttpOnly cookies, never browser storage.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
