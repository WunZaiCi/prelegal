"use client";

import { useState } from "react";
import { login, register, type User } from "@/lib/auth";

const labelClass =
  "block font-ui text-[11px] font-600 uppercase tracking-[0.14em] text-muted";

const controlClass =
  "mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-blue focus:ring-2 focus:ring-blue/20";

/**
 * Login / registration form backed by the real auth API. `mode` switches the
 * copy and which endpoint is called; `onSuccess` receives the signed-in user.
 */
export default function AuthForm({
  mode,
  onSuccess,
}: {
  mode: "login" | "register";
  onSuccess: (user: User) => void;
}) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const user = isRegister
        ? await register(email, password)
        : await login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <label className="block">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          className={controlClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isRegister ? "At least 8 characters" : "••••••••"}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          className={controlClass}
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-purple/30 bg-purple/[0.06] px-3 py-2 font-body text-[13px] text-purple"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="group mt-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-purple px-6 py-3 font-ui text-[13px] font-600 tracking-[0.04em] text-white shadow-document transition-all hover:bg-purple-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? isRegister
            ? "Creating account…"
            : "Signing in…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}
