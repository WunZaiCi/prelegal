/**
 * Client for the AI chat endpoint (PL-5) plus the logic to merge the AI's
 * extracted fields into the NDA form state.
 */

import type { NdaFormData, NdaParty } from "./nda-types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Partial NDA updates returned by the AI — mirrors the backend ExtractedFields. */
export interface ExtractedFields {
  purpose?: string;
  effectiveDate?: string;
  termMode?: NdaFormData["termMode"];
  termYears?: number;
  confidentialityMode?: NdaFormData["confidentialityMode"];
  confidentialityYears?: number;
  governingLaw?: string;
  jurisdiction?: string;
  modifications?: string;
  party1?: Partial<NdaParty>;
  party2?: Partial<NdaParty>;
}

export interface ChatResponse {
  reply: string;
  fields: ExtractedFields;
}

// Empty = same origin (how it runs in the single Docker container). For local
// `next dev` against a separate backend, set NEXT_PUBLIC_API_BASE.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function sendChat(
  messages: ChatMessage[],
  data: NdaFormData,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, data }),
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body; keep the generic message */
    }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Merge the AI's partial field updates into the NDA data. Only defined,
 * non-null values override existing ones; party objects merge field-by-field.
 */
export function mergeFields(
  data: NdaFormData,
  f: ExtractedFields,
): NdaFormData {
  const next: NdaFormData = { ...data };

  if (f.purpose != null) next.purpose = f.purpose;
  if (f.effectiveDate != null) next.effectiveDate = f.effectiveDate;
  if (f.termMode != null) next.termMode = f.termMode;
  if (f.termYears != null) next.termYears = f.termYears;
  if (f.confidentialityMode != null) next.confidentialityMode = f.confidentialityMode;
  if (f.confidentialityYears != null) next.confidentialityYears = f.confidentialityYears;
  if (f.governingLaw != null) next.governingLaw = f.governingLaw;
  if (f.jurisdiction != null) next.jurisdiction = f.jurisdiction;
  if (f.modifications != null) next.modifications = f.modifications;

  next.party1 = mergeParty(data.party1, f.party1);
  next.party2 = mergeParty(data.party2, f.party2);
  return next;
}

function mergeParty(party: NdaParty, partial?: Partial<NdaParty>): NdaParty {
  if (!partial) return party;
  const merged = { ...party };
  if (partial.company != null) merged.company = partial.company;
  if (partial.printName != null) merged.printName = partial.printName;
  if (partial.title != null) merged.title = partial.title;
  if (partial.noticeAddress != null) merged.noticeAddress = partial.noticeAddress;
  return merged;
}
