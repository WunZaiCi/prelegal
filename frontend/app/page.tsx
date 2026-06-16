"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import ChatPanel from "@/components/ChatPanel";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericPreview from "@/components/GenericPreview";
import NdaPreview from "@/components/NdaPreview";
import {
  createDocument,
  getDocument as fetchSavedDocument,
  updateDocument,
} from "@/lib/api";
import { getDocument, type GenericDocData } from "@/lib/documents";
import { defaultNdaData, todayIso, type NdaFormData } from "@/lib/nda-types";

export default function Home() {
  return (
    <AppShell>
      <Editor />
    </AppShell>
  );
}

function Editor() {
  const [docType, setDocType] = useState<string | null>(null);
  const [ndaData, setNdaData] = useState<NdaFormData>(defaultNdaData);
  const [genericData, setGenericData] = useState<GenericDocData>({});
  const [title, setTitle] = useState("");
  const [docId, setDocId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Default the NDA Effective Date to today, client-side, to avoid hydration
  // mismatches with the statically prerendered HTML.
  useEffect(() => {
    setNdaData((prev) =>
      prev.effectiveDate ? prev : { ...prev, effectiveDate: todayIso() },
    );
  }, []);

  // Open a saved document when arrived at via /?doc=<id>.
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("doc"));
    if (!id) return;
    let active = true;
    fetchSavedDocument(id)
      .then((doc) => {
        if (!active) return;
        const spec = getDocument(doc.docType);
        if (!spec) return;
        setDocType(doc.docType);
        setTitle(doc.title);
        setDocId(doc.id);
        if (spec.kind === "nda") {
          setNdaData(doc.data as NdaFormData);
        } else {
          setGenericData(doc.data as GenericDocData);
        }
      })
      .catch(() => {
        /* invalid id / not found — just start a fresh document */
      });
    return () => {
      active = false;
    };
  }, []);

  const spec = docType ? getDocument(docType) ?? null : null;

  // Switching document type starts a fresh (unsaved) draft with a default title.
  const handleDocTypeChange = (newType: string) => {
    setDocType(newType);
    setDocId(null);
    setSaved(false);
    setTitle(getDocument(newType)?.name ?? "");
  };

  const handleNdaData = (d: NdaFormData) => {
    setNdaData(d);
    setSaved(false);
  };
  const handleGenericData = (d: GenericDocData) => {
    setGenericData(d);
    setSaved(false);
  };
  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!spec || saving) return;
    setSaving(true);
    setSaveError(null);
    const data = spec.kind === "nda" ? ndaData : genericData;
    const finalTitle = title.trim() || spec.name;
    try {
      if (docId == null) {
        const created = await createDocument({
          docType: spec.id,
          title: finalTitle,
          data,
        });
        setDocId(created.id);
      } else {
        await updateDocument(docId, { title: finalTitle, data });
      }
      setTitle(finalTitle);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
      {/* Masthead */}
      <header className="flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-700 leading-[1.05] text-navy sm:text-[40px]">
            Legal Document Creator
          </h1>
          <p className="mt-2 max-w-md font-body text-[15px] text-muted">
            Chat with our AI to choose the right document, watch it take shape,
            and download a ready-to-sign PDF.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!spec || saving}
            className="rounded-full bg-purple px-6 py-3 font-ui text-[13px] font-600 tracking-[0.04em] text-white shadow-document transition-all hover:bg-purple-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
          <DownloadPdfButton
            spec={spec}
            ndaData={ndaData}
            genericData={genericData}
          />
        </div>
      </header>

      {/* Title + save error */}
      {spec ? (
        <div className="mb-2">
          <label className="block">
            <span className="font-ui text-[11px] font-600 uppercase tracking-[0.14em] text-muted">
              Document title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={spec.name}
              aria-label="Document title"
              className="mt-2 w-full max-w-lg rounded-md border border-line bg-surface px-3 py-2 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </label>
          {saveError ? (
            <p className="mt-2 font-body text-[13px] text-purple">{saveError}</p>
          ) : null}
        </div>
      ) : null}

      {/* Workspace */}
      <div className="grid grid-cols-1 gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Input column — AI chat */}
        <div className="animate-rise">
          <SectionTag>AI assistant</SectionTag>
          <div className="mt-6">
            <ChatPanel
              docType={docType}
              onDocTypeChange={handleDocTypeChange}
              ndaData={ndaData}
              onNdaData={handleNdaData}
              genericData={genericData}
              onGenericData={handleGenericData}
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

      <footer className="py-8 font-ui text-[11px] uppercase tracking-[0.16em] text-muted/70">
        Document text © Common Paper, used under CC BY 4.0 · Drafts only — have a
        lawyer review before use.
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
