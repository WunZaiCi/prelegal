"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMe, logout, type User } from "@/lib/auth";
import Disclaimer from "./Disclaimer";

/**
 * Authenticated app shell: validates the session, then renders a top nav
 * (logo, primary links, signed-in user + sign out), the draft disclaimer, and
 * the page content. Unauthenticated visitors are bounced to /login, so wrapped
 * pages don't repeat the auth gate.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getMe().then((u) => {
      if (!active) return;
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready || !user) return null;

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-navy font-display text-[16px] font-700 text-white">
                P
              </span>
              <span className="font-ui text-[13px] font-600 uppercase tracking-[0.24em] text-muted">
                Prelegal
              </span>
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              <NavLink href="/" active={pathname === "/"}>
                New document
              </NavLink>
              <NavLink href="/documents" active={pathname === "/documents"}>
                My documents
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-body text-[13px] text-muted sm:inline">
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-ui text-[12px] font-600 uppercase tracking-[0.16em] text-muted transition-colors hover:text-purple"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <Disclaimer />

      {children}
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 font-ui text-[13px] font-600 transition-colors ${
        active ? "bg-canvas text-navy" : "text-muted hover:text-navy"
      }`}
    >
      {children}
    </Link>
  );
}
