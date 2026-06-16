"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = () => {
    signIn();
    router.push("/");
  };

  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md animate-rise">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink font-display text-[16px] font-700 text-paper">
            P
          </span>
          <span className="font-ui text-[13px] font-600 uppercase tracking-[0.24em] text-ink-soft">
            Prelegal
          </span>
        </div>

        <h1 className="mt-6 font-display text-[34px] font-600 leading-[1.05] text-ink">
          Welcome back
        </h1>
        <p className="mt-2 font-body text-[15px] italic text-ink-soft">
          Sign in to start drafting your agreements.
        </p>

        <div className="mt-8 rounded-xl border border-line bg-paper-deep/40 p-6 shadow-document sm:p-8">
          <LoginForm onSignIn={handleSignIn} />
        </div>

        <p className="mt-6 font-ui text-[11px] uppercase tracking-[0.16em] text-ink-soft/70">
          Prelegal · This tool does not provide legal advice.
        </p>
      </div>
    </main>
  );
}
