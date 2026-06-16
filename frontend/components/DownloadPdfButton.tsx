"use client";

import { useState } from "react";
import type { DocumentSpec, GenericDocData } from "@/lib/documents";
import { PARTY_SUBFIELDS } from "@/lib/documents";
import type { NdaFormData } from "@/lib/nda-types";

const slug = (s: string) =>
  s
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

/** Build a filesystem-friendly filename from the parties' companies (NDA). */
export function buildFilename(data: NdaFormData): string {
  const parties = [data.party1.company, data.party2.company]
    .map(slug)
    .filter(Boolean)
    .join("_and_");
  return parties ? `Mutual-NDA_${parties}.pdf` : "Mutual-NDA.pdf";
}

/** Filename for a generic document: `<Doc-Name>_<companies>.pdf`. */
export function buildGenericFilename(
  spec: DocumentSpec,
  data: GenericDocData,
): string {
  const base = slug(spec.name) || "Agreement";
  const companies = (spec.keyTerms ?? [])
    .filter((t) => t.type === "party")
    .map((t) => slug(data[`${t.key}_${PARTY_SUBFIELDS[0].suffix}`] ?? ""))
    .filter(Boolean)
    .join("_and_");
  return companies ? `${base}_${companies}.pdf` : `${base}.pdf`;
}

export default function DownloadPdfButton({
  spec,
  ndaData,
  genericData,
}: {
  spec: DocumentSpec | null;
  ndaData: NdaFormData;
  genericData: GenericDocData;
}) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (!spec) return;
    setBusy(true);
    try {
      // Imported lazily so @react-pdf/renderer never runs during SSR.
      const { pdf } = await import("@react-pdf/renderer");

      let blob: Blob;
      let filename: string;
      if (spec.kind === "nda") {
        const { default: NdaPdfDocument } = await import("./NdaPdfDocument");
        blob = await pdf(<NdaPdfDocument data={ndaData} />).toBlob();
        filename = buildFilename(ndaData);
      } else {
        const { default: GenericPdfDocument } = await import(
          "./GenericPdfDocument"
        );
        blob = await pdf(
          <GenericPdfDocument spec={spec} data={genericData} />,
        ).toBlob();
        filename = buildGenericFilename(spec, genericData);
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
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
      disabled={busy || !spec}
      className="group inline-flex items-center gap-2.5 rounded-full bg-blue px-6 py-3 font-ui text-[13px] font-600 tracking-[0.04em] text-white shadow-document transition-all hover:bg-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
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
