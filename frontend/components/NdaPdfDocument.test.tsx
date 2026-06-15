// @vitest-environment node
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";
import NdaPdfDocument from "./NdaPdfDocument";

/**
 * End-to-end smoke test: the document must actually render to a valid PDF
 * through @react-pdf/renderer. Textual correctness of the clauses is covered by
 * the verbatim transcription tests in `lib/standard-terms.test.ts`, since both
 * the PDF and the preview consume the same STANDARD_TERMS source.
 */

const isPdf = (buf: Buffer) => buf.subarray(0, 5).toString("latin1") === "%PDF-";

const filled = (): NdaFormData => ({
  ...defaultNdaData(),
  effectiveDate: "2026-06-15",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  party1: {
    company: "Acme, Inc.",
    printName: "Jane Doe",
    title: "CEO",
    noticeAddress: "legal@acme.com",
  },
  party2: {
    company: "Globex LLC",
    printName: "John Roe",
    title: "President",
    noticeAddress: "123 Main St",
  },
});

describe("NdaPdfDocument", () => {
  it("renders a valid, non-empty PDF for the default (empty) form", async () => {
    const buf = await renderToBuffer(<NdaPdfDocument data={defaultNdaData()} />);
    expect(isPdf(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("renders a valid PDF for a fully filled form", async () => {
    const buf = await renderToBuffer(<NdaPdfDocument data={filled()} />);
    expect(isPdf(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });
}, 30_000);
