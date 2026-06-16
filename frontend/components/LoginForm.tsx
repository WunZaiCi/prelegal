"use client";

import { useState } from "react";

const labelClass =
  "block font-ui text-[11px] font-600 uppercase tracking-[0.14em] text-ink-soft";

const controlClass =
  "mt-2 w-full rounded-md border border-line bg-paper px-3 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-oxblood focus:ring-2 focus:ring-oxblood/15";

/**
 * Presentational sign-in card for the V1 fake login.
 *
 * The email/password fields are cosmetic — nothing is validated or sent
 * anywhere. Submitting simply calls `onSignIn`, which the page uses to record
 * the fake session and route into the platform.
 */
export default function LoginForm({ onSignIn }: { onSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="block">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className={controlClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className={controlClass}
        />
      </label>

      <button
        type="submit"
        className="group mt-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3 font-ui text-[13px] font-600 tracking-[0.04em] text-paper shadow-document transition-all hover:bg-oxblood"
      >
        Continue
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="transition-transform group-hover:translate-x-0.5"
          aria-hidden
        >
          <path
            d="M2.5 8h10m0 0L9 4.5M12.5 8 9 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <p className="font-body text-[13px] italic text-ink-soft">
        Demo access — no account required. Any details take you straight into the
        platform.
      </p>
    </form>
  );
}
