/**
 * Data model for the Common Paper Mutual NDA Cover Page (PL-3).
 *
 * Only the Cover Page is user-supplied; the Standard Terms (see
 * `standard-terms.ts`) are boilerplate appended verbatim to every document.
 */

/** A signing party as captured on the Cover Page signature table. */
export interface NdaParty {
  company: string;
  printName: string;
  title: string;
  noticeAddress: string;
}

/** How the MNDA term is bounded. */
export type TermMode = "expires" | "untilTerminated";

/** How long confidential information stays protected. */
export type ConfidentialityMode = "years" | "perpetuity";

export interface NdaFormData {
  /** How Confidential Information may be used. */
  purpose: string;
  /** ISO date string (yyyy-mm-dd) for the Effective Date. */
  effectiveDate: string;

  /** MNDA Term. */
  termMode: TermMode;
  /** Number of years the MNDA lasts (used when termMode === "expires"). */
  termYears: number;

  /** Term of Confidentiality. */
  confidentialityMode: ConfidentialityMode;
  /** Years CI is protected (used when confidentialityMode === "years"). */
  confidentialityYears: number;

  /** Governing law — a US state. */
  governingLaw: string;
  /** Jurisdiction — city/county and state for courts. */
  jurisdiction: string;
  /** Free-text list of modifications to the MNDA. */
  modifications: string;

  party1: NdaParty;
  party2: NdaParty;
}

const emptyParty = (): NdaParty => ({
  company: "",
  printName: "",
  title: "",
  noticeAddress: "",
});

/** Today's date as an ISO yyyy-mm-dd string (client-local). */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * Sensible starting values mirroring the template's example placeholders.
 *
 * `effectiveDate` is intentionally left blank here so this function is pure and
 * deterministic — a date derived from `new Date()` would be baked into the
 * statically prerendered HTML and mismatch the client on hydration. The page
 * fills in today's date on mount instead.
 */
export const defaultNdaData = (): NdaFormData => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  termMode: "expires",
  termYears: 1,
  confidentialityMode: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty(),
  party2: emptyParty(),
});

/** Format an ISO date (yyyy-mm-dd) as a readable long date. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Human-readable description of the MNDA Term for rendering. */
export function describeTerm(data: NdaFormData): string {
  if (data.termMode === "untilTerminated") {
    return "Continues until terminated in accordance with the terms of the MNDA.";
  }
  const y = data.termYears;
  return `Expires ${y} year${y === 1 ? "" : "s"} from the Effective Date.`;
}

/** Human-readable description of the Term of Confidentiality for rendering. */
export function describeConfidentiality(data: NdaFormData): string {
  if (data.confidentialityMode === "perpetuity") {
    return "In perpetuity.";
  }
  const y = data.confidentialityYears;
  return `${y} year${
    y === 1 ? "" : "s"
  } from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`;
}
