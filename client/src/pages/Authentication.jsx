import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  setPersistence,
  signInWithCustomToken,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { auth } from "../auth/firebase";

import {
  API_URL,
  APP_NAME,
  APP_TAGLINE,
} from "../config/app";

import {
  resolvePostLoginRoute,
} from "../utils/resolvePostLoginRoute";

const googleProvider =
  new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  identifier: "",
  password: "",
  confirm: "",
};

function Field({
  label,
  ...props
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">
        {label}
      </span>

      <input
        {...props}
        className="mt-1.5 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

export default function Authentication() {
  const navigate =
    useNavigate();

  const [mode, setMode] =
    useState("signin");

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const signingUp =
    mode === "signup";

  useEffect(() => {
    document.title =
      `Sign in | ${APP_NAME}`;

    let active = true;

    const finishRedirect =
      async () => {
        try {
          const result =
            await getRedirectResult(
              auth,
            );

          if (
            active &&
            result?.user
          ) {
            const route =
              await resolvePostLoginRoute(
                result.user,
              );

            navigate(
              route,
              {
                replace: true,
              },
            );
          }
        } catch (redirectError) {
          if (!active) return;

          setError(
            redirectError.message ||
              "Google sign-in could not be completed.",
          );
        }
      };

    finishRedirect();

    return () => {
      active = false;
    };
  }, [navigate]);

  const setField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const completeLogin =
    async (user) => {
      // Force one fresh ID token now.
      // Firebase will manage refresh-token persistence afterwards.
      await user.getIdToken(
        true,
      );

      const route =
        await resolvePostLoginRoute(
          user,
        );

      navigate(
        route,
        {
          replace: true,
        },
      );
    };

  const handleLocalSubmit =
    async (event) => {
      event.preventDefault();
      setError("");

      if (signingUp) {
        if (
          form.password !==
          form.confirm
        ) {
          setError(
            "Passwords do not match.",
          );
          return;
        }

        if (
          form.password.length <
          8
        ) {
          setError(
            "Password must be at least 8 characters.",
          );
          return;
        }
      }

      setLoading(true);

      try {
        await setPersistence(
          auth,
          browserLocalPersistence,
        );

        const endpoint =
          signingUp
            ? "register"
            : "login";

        const body =
          signingUp
            ? {
                name:
                  form.name,
                username:
                  form.username,
                email:
                  form.email,
                password:
                  form.password,
              }
            : {
                identifier:
                  form.identifier,
                password:
                  form.password,
              };

        const response =
          await fetch(
            `${API_URL}/api/auth/${endpoint}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify(
                  body,
                ),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Authentication failed",
          );
        }

        const credential =
          await signInWithCustomToken(
            auth,
            data.token,
          );

        await completeLogin(
          credential.user,
        );
      } catch (localError) {
        console.error(
          "Local authentication failed:",
          localError,
        );

        setError(
          localError.message ||
            "Authentication failed",
        );
      } finally {
        setLoading(false);
      }
    };

  const handleGoogle =
    async () => {
      setError("");
      setLoading(true);

      try {
        await setPersistence(
          auth,
          browserLocalPersistence,
        );

        const credential =
          await signInWithPopup(
            auth,
            googleProvider,
          );

        await completeLogin(
          credential.user,
        );
      } catch (googleError) {
        const redirectCodes =
          new Set([
            "auth/popup-blocked",
            "auth/cancelled-popup-request",
            "auth/operation-not-supported-in-this-environment",
          ]);

        if (
          redirectCodes.has(
            googleError?.code,
          )
        ) {
          await signInWithRedirect(
            auth,
            googleProvider,
          );

          return;
        }

        if (
          googleError?.code !==
          "auth/popup-closed-by-user"
        ) {
          console.error(
            "Google sign-in failed:",
            googleError,
          );

          setError(
            googleError.message ||
              "Google sign-in failed",
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const changeMode =
    (next) => {
      setMode(next);
      setForm(EMPTY_FORM);
      setError("");
    };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 text-stone-950 dark:bg-slate-950 dark:text-white sm:py-12">
      <main className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl shadow-stone-950/5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="inline-flex items-center gap-3"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white font-extrabold text-stone-950">
                S
              </span>

              <span className="font-heading text-xl font-extrabold">
                Shopora
              </span>
            </button>

            <h1 className="font-heading mt-16 max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
              Train better.
              <br />
              Shop smarter.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-stone-400">
              One account for your Shopora store, cart, orders, fitness tools, rewards and membership.
            </p>
          </div>

          <div className="grid gap-3 text-xs text-stone-400">
            <p>✓ Google sign-in through Firebase</p>
            <p>✓ Local passwords hashed with bcrypt</p>
            <p>✓ Firebase-managed session refresh</p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              {APP_TAGLINE}
            </p>

            <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight">
              {signingUp
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-slate-400">
              {signingUp
                ? "Register with your name, username, email and a secure password."
                : "Sign in with Google or your Shopora email/username and password."}
            </p>

            <div className="mt-6 grid grid-cols-2 rounded-2xl bg-stone-100 p-1 dark:bg-slate-950">
              <button
                type="button"
                onClick={() =>
                  changeMode(
                    "signin",
                  )
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  !signingUp
                    ? "bg-white text-stone-950 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-stone-500 dark:text-slate-400"
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() =>
                  changeMode(
                    "signup",
                  )
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  signingUp
                    ? "bg-white text-stone-950 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-stone-500 dark:text-slate-400"
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleLocalSubmit
              }
              className="mt-6 space-y-4"
            >
              {signingUp ? (
                <>
                  <Field
                    label="Name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) =>
                      setField(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="Basant Raj"
                    required
                  />

                  <Field
                    label="Username"
                    type="text"
                    autoComplete="username"
                    value={
                      form.username
                    }
                    onChange={(event) =>
                      setField(
                        "username",
                        event.target.value,
                      )
                    }
                    placeholder="basant.raj"
                    required
                  />

                  <Field
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      setField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    required
                  />
                </>
              ) : (
                <Field
                  label="Email or username"
                  type="text"
                  autoComplete="username"
                  value={
                    form.identifier
                  }
                  onChange={(event) =>
                    setField(
                      "identifier",
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com or basant.raj"
                  required
                />
              )}

              <Field
                label="Password"
                type="password"
                autoComplete={
                  signingUp
                    ? "new-password"
                    : "current-password"
                }
                value={
                  form.password
                }
                onChange={(event) =>
                  setField(
                    "password",
                    event.target.value,
                  )
                }
                placeholder="At least 8 characters"
                required
              />

              {signingUp && (
                <Field
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  value={
                    form.confirm
                  }
                  onChange={(event) =>
                    setField(
                      "confirm",
                      event.target.value,
                    )
                  }
                  placeholder="Repeat your password"
                  required
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="shopora-button-press min-h-12 w-full rounded-full bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {loading
                  ? "Please wait…"
                  : signingUp
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
                or
              </span>
              <div className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogle}
              className="shopora-button-press flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 text-sm font-bold text-stone-800 transition hover:bg-stone-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              <span className="text-base font-extrabold text-blue-600">
                G
              </span>
              Continue with Google
            </button>

            <p className="mt-6 text-xs leading-5 text-stone-400">
              Local passwords are stored only as salted bcrypt hashes in MongoDB. Firebase manages the signed-in browser session and token refresh after authentication succeeds.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
