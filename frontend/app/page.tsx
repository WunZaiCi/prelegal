"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericPreview from "@/components/GenericPreview";
import NdaPreview from "@/components/NdaPreview";
import { getDocument, type GenericDocData } from "@/lib/documents";
import { isAuthed, signOut } from "@/lib/auth";
import { defaultNdaData, todayIso, type NdaFormData } from "@/lib/nda-types";

export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [ndaData, setNdaData] = useState<NdaFormData>(defaultNdaData);
  const [genericData, setGenericData] = useState<GenericDocData>({});

  // Gate the platform behind the fake login: bounce to /login if not signed in.
  useEffect(() => {
    if (isAuthed()) {
      setAuthed(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Default the NDA Effective Date to today, client-side, to avoid hydration
  // mismatches with the statically prerendered HTML.
  useEffect(() => {
    setNdaData((prev) =>
      prev.effectiveDate ? prev : { ...prev, effectiveDate: todayIso() },
    );
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  // Avoid flashing the platform before the auth check resolves.
  if (!authed) return null;

  const spec = docType ? getDocument(docType) ?? null : null;

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
      {/* Masthead */}
      <header className="flex flex-col gap-6 border-b border-line py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-navy font-display text-[16px] font-700 text-white">
              P
            </span>
            <span className="font-ui text-[13px] font-600 uppercase tracking-[0.24em] text-muted">
              Prelegal
            </span>
          </div>
          <h1 className="mt-4 font-display text-[34px] font-700 leading-[1.05] text-navy sm:text-[44px]">
            Legal Document Creator
          </h1>
          <p className="mt-2 max-w-md font-body text-[15px] text-muted">
            Chat with our AI to choose the right document, watch it take shape,
            and download a ready-to-sign PDF.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <DownloadPdfButton
            spec={spec}
            ndaData={ndaData}
            genericData={genericData}
          />
          <button
            type="button"
            onClick={handleSignOut}
            className="font-ui text-[12px] font-600 uppercase tracking-[0.16em] text-muted transition-colors hover:text-purple"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Input column — AI chat */}
        <div className="animate-rise">
          <SectionTag>AI assistant</SectionTag>
          <div className="mt-6">
            <ChatPanel
              docType={docType}
              onDocTypeChange={setDocType}
              ndaData={ndaData}
              onNdaData={setNdaData}
              genericData={genericData}
              onGenericData={setGenericData}
            />
          </div>
        </div>

        {/* Preview column */}
        <div className="animate-rise [animation-delay:120ms]">
          <div className="flex items-center justify-between">
            <SectionTag>Live preview</SectionTag>
            <span className="font-ui text-[11px] uppercase tracking-[0.16em] text-muted/70">
              {spec ? spec.name : "No document yet"}
            </span>
          </div>
          <div className="preview-scroll mt-6 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-6 sm:p-6">
            {spec === null ? (
              <Placeholder />
            ) : spec.kind === "nda" ? (
              <NdaPreview data={ndaData} />
            ) : (
              <GenericPreview spec={spec} data={genericData} />
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-line py-8 font-ui text-[11px] uppercase tracking-[0.16em] text-muted/70">
        Document text © Common Paper, used under CC BY 4.0 · This tool does not
        provide legal advice.
      </footer>
    </main>
  );
}

function Placeholder() {
  return (
    <div className="grid min-h-[360px] place-items-center px-6 py-16 text-center">
      <div>
        <p className="font-display text-[18px] font-600 text-navy">
          Let&apos;s pick a document
        </p>
        <p className="mt-2 font-body text-[14px] text-muted">
          Tell the assistant what you need. Once we settle on a document type,
          your live preview will appear here.
        </p>
      </div>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-6 bg-yellow" />
      <span className="font-ui text-[12px] font-700 uppercase tracking-[0.2em] text-blue">
        {children}
      </span>
    </div>
  );
}
