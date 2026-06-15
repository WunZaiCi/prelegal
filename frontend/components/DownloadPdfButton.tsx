"use client";

import { useState } from "react";
import type { NdaFormData } from "@/lib/nda-types";

/** Build a filesystem-friendly filename from the parties' companies. */
export function buildFilename(data: NdaFormData): string {
  const slug = (s: string) =>
    s
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
  const a = slug(data.party1.company);
  const b = slug(data.party2.company);
  const parties = [a, b].filter(Boolean).join("_and_");
  return parties ? `Mutual-NDA_${parties}.pdf` : "Mutual-NDA.pdf";
}

export default function DownloadPdfButton({ data }: { data: NdaFormData }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      // Imported lazily so @react-pdf/renderer never runs during SSR.
      const [{ pdf }, { default: NdaPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NdaPdfDocument"),
      ]);

      const blob = await pdf(<NdaPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(data);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Sorry — something went wrong generating the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 font-ui text-[13px] font-600 tracking-[0.04em] text-paper shadow-document transition-all hover:bg-oxblood disabled:cursor-wait disabled:opacity-70"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={busy ? "animate-pulse" : "transition-transform group-hover:translate-y-0.5"}
        aria-hidden
      >
        <path
          d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 13.5h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {busy ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
