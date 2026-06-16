"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { isAuthed, signOut } from "@/lib/auth";
import { defaultNdaData, todayIso, type NdaFormData } from "@/lib/nda-types";

export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<NdaFormData>(defaultNdaData);
  const [mode, setMode] = useState<Mode>("chat");

  // Gate the platform behind the fake login: bounce to /login if not signed in.
  useEffect(() => {
    if (isAuthed()) {
      setAuthed(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Default the Effective Date to today, client-side, to avoid hydration
  // mismatches with the statically prerendered HTML.
  useEffect(() => {
    setData((prev) =>
      prev.effectiveDate ? prev : { ...prev, effectiveDate: todayIso() },
    );
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  // Avoid flashing the platform before the auth check resolves.
  if (!authed) return null;

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
      {/* Masthead */}
      <header className="flex flex-col gap-6 border-b border-line py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink font-display text-[16px] font-700 text-paper">
              P
            </span>
            <span className="font-ui text-[13px] font-600 uppercase tracking-[0.24em] text-ink-soft">
              Prelegal
            </span>
          </div>
          <h1 className="mt-4 font-display text-[34px] font-600 leading-[1.05] text-ink sm:text-[44px]">
            Mutual NDA Creator
          </h1>
          <p className="mt-2 max-w-md font-body text-[15px] italic text-ink-soft">
            Fill in the details, watch your agreement take shape, and download a
            ready-to-sign PDF.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <DownloadPdfButton data={data} />
          <button
            type="button"
            onClick={handleSignOut}
            className="font-ui text-[12px] font-600 uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-oxblood"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Input column — AI chat (default) or the manual form */}
        <div className="animate-rise">
          <div className="flex items-center justify-between gap-4">
            <SectionTag>
              {mode === "chat" ? "Chat with AI" : "The details"}
            </SectionTag>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <div className="mt-6">
            {mode === "chat" ? (
              <ChatPanel data={data} onChange={setData} />
            ) : (
              <NdaForm data={data} onChange={setData} />
            )}
          </div>
        </div>

        {/* Preview column */}
        <div className="animate-rise [animation-delay:120ms]">
          <div className="flex items-center justify-between">
            <SectionTag>Live preview</SectionTag>
            <span className="font-ui text-[11px] uppercase tracking-[0.16em] text-ink-soft/70">
              Common Paper · v1.0
            </span>
          </div>
          <div className="preview-scroll mt-6 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl bg-paper-deep/50 p-4 lg:sticky lg:top-6 sm:p-6">
            <NdaPreview data={data} />
          </div>
        </div>
      </div>

      <footer className="border-t border-line py-8 font-ui text-[11px] uppercase tracking-[0.16em] text-ink-soft/70">
        Document text © Common Paper, used under CC BY 4.0 · This tool does not
        provide legal advice.
      </footer>
    </main>
  );
}

type Mode = "chat" | "form";

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const options: { value: Mode; label: string }[] = [
    { value: "chat", label: "AI chat" },
    { value: "form", label: "Manual form" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-full border border-line bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={mode === o.value}
          className={`rounded-full px-3 py-1.5 font-ui text-[12px] font-600 tracking-[0.04em] transition-colors ${
            mode === o.value
              ? "bg-ink text-paper"
              : "text-ink-soft hover:text-oxblood"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-6 bg-oxblood" />
      <span className="font-ui text-[12px] font-700 uppercase tracking-[0.2em] text-oxblood">
        {children}
      </span>
    </div>
  );
}
