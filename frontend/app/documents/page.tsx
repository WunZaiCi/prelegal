"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import DocumentsList from "@/components/DocumentsList";
import {
  deleteDocument,
  listDocuments,
  type SavedDocumentSummary,
} from "@/lib/api";

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<SavedDocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listDocuments()
      .then((d) => active && setDocs(d))
      .catch(
        (e) =>
          active &&
          setError(e instanceof Error ? e.message : "Failed to load documents."),
      );
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument(id);
      setDocs((cur) => cur?.filter((d) => d.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete document.");
    }
  };

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-700 leading-tight text-navy sm:text-[34px]">
              My documents
            </h1>
            <p className="mt-2 font-body text-[15px] text-muted">
              Your saved drafts. Open one to keep editing or download it again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="shrink-0 rounded-full bg-blue px-5 py-2.5 font-ui text-[13px] font-600 tracking-[0.04em] text-white transition-colors hover:bg-blue-deep"
          >
            New document
          </button>
        </div>

        <div className="mt-8 animate-rise">
          {error ? (
            <p className="rounded-md border border-purple/30 bg-purple/[0.06] px-4 py-3 font-body text-[14px] text-purple">
              {error}
            </p>
          ) : docs === null ? (
            <p className="font-body text-[14px] text-muted">Loading…</p>
          ) : (
            <DocumentsList
              documents={docs}
              onOpen={(id) => router.push(`/?doc=${id}`)}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </AppShell>
  );
}
