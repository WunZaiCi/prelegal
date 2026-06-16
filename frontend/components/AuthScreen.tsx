"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthForm from "./AuthForm";

/** Branded login / registration screen wrapping the shared AuthForm. */
export default function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md animate-rise">
        <Link href="/login" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-navy font-display text-[16px] font-700 text-white">
            P
          </span>
          <span className="font-ui text-[13px] font-600 uppercase tracking-[0.24em] text-muted">
            Prelegal
          </span>
        </Link>

        <h1 className="mt-6 font-display text-[34px] font-700 leading-[1.05] text-navy">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 font-body text-[15px] text-muted">
          {isRegister
            ? "Sign up to start drafting your legal documents."
            : "Sign in to continue drafting your documents."}
        </p>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-document sm:p-8">
          <AuthForm mode={mode} onSuccess={() => router.push("/")} />
        </div>

        <p className="mt-6 font-body text-[14px] text-muted">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-600 text-blue hover:text-blue-deep">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Prelegal?{" "}
              <Link
                href="/register"
                className="font-600 text-blue hover:text-blue-deep"
              >
                Create an account
              </Link>
            </>
          )}
        </p>

        <p className="mt-6 font-ui text-[11px] uppercase tracking-[0.16em] text-muted/70">
          Prelegal · Drafts only — not legal advice.
        </p>
      </div>
    </main>
  );
}
