"use client";

import { getDocument } from "@/lib/documents";
import type { SavedDocumentSummary } from "@/lib/api";

function formatWhen(iso: string): string {
  // SQLite returns "YYYY-MM-DD HH:MM:SS" (UTC); show a readable local date.
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsList({
  documents,
  onOpen,
  onDelete,
}: {
  documents: SavedDocumentSummary[];
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-line bg-surface px-6 py-20 text-center">
        <div>
          <p className="font-display text-[18px] font-600 text-navy">
            No saved documents yet
          </p>
          <p className="mt-2 font-body text-[14px] text-muted">
            Draft a document with the assistant and hit Save — it&apos;ll show up
            here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {documents.map((doc) => {
        const typeName = getDocument(doc.docType)?.name ?? doc.docType;
        return (
          <li
            key={doc.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-blue/40"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] font-600 text-navy">
                {doc.title}
              </p>
              <p className="mt-0.5 font-ui text-[12px] uppercase tracking-[0.14em] text-muted">
                {typeName} · Updated {formatWhen(doc.updatedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(doc.id)}
                className="rounded-full bg-blue px-4 py-2 font-ui text-[12px] font-600 tracking-[0.04em] text-white transition-colors hover:bg-blue-deep"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                aria-label={`Delete ${doc.title}`}
                className="rounded-full border border-line px-4 py-2 font-ui text-[12px] font-600 tracking-[0.04em] text-muted transition-colors hover:border-purple/40 hover:text-purple"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
