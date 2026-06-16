/**
 * Document-type registry (PL-6).
 *
 * Loads the shared `documents.json` (the single source of truth, also read by
 * the backend) and exposes typed helpers. `nda` documents use the bespoke
 * Mutual NDA pipeline; `generic` documents are driven entirely by their
 * `keyTerms` — collected over chat and rendered by the generic preview / PDF.
 */

import documentsData from "./documents.json";

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "select"
  | "party";

export interface KeyTerm {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];
}

export type DocumentKind = "nda" | "generic";

export interface DocumentSpec {
  id: string;
  name: string;
  kind: DocumentKind;
  description: string;
  /** Present for `generic` documents; absent for the bespoke NDA. */
  keyTerms?: KeyTerm[];
}

/** Flat string map of a generic document's collected values. */
export type GenericDocData = Record<string, string>;

/** Sub-fields a `party` key expands into (suffix appended as `<key>_<suffix>`). */
export const PARTY_SUBFIELDS: { suffix: string; label: string }[] = [
  { suffix: "company", label: "Company" },
  { suffix: "name", label: "Print Name" },
  { suffix: "title", label: "Title" },
  { suffix: "notice", label: "Notice Address" },
];

export const DOCUMENTS: DocumentSpec[] = (
  documentsData as { documents: DocumentSpec[] }
).documents;

export function getDocument(id: string): DocumentSpec | undefined {
  return DOCUMENTS.find((d) => d.id === id);
}

/**
 * The leaf data keys for a generic document, expanding every `party` field into
 * its four sub-fields. Order follows the keyTerms, sub-fields inner.
 */
export function leafKeys(spec: DocumentSpec): string[] {
  const keys: string[] = [];
  for (const t of spec.keyTerms ?? []) {
    if (t.type === "party") {
      for (const sub of PARTY_SUBFIELDS) keys.push(`${t.key}_${sub.suffix}`);
    } else {
      keys.push(t.key);
    }
  }
  return keys;
}

/** Empty starting values for a generic document (every leaf key blank). */
export function emptyGenericData(spec: DocumentSpec): GenericDocData {
  const data: GenericDocData = {};
  for (const k of leafKeys(spec)) data[k] = "";
  return data;
}

/**
 * Merge AI-extracted updates into generic data. Only keys that belong to the
 * document and carry a non-empty value override existing ones, so the model
 * can never wipe a field by returning a blank.
 */
export function mergeGenericFields(
  spec: DocumentSpec,
  data: GenericDocData,
  updates: GenericDocData | null | undefined,
): GenericDocData {
  if (!updates) return data;
  const allowed = new Set(leafKeys(spec));
  const next = { ...data };
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.has(k) && v != null && String(v).trim() !== "") {
      next[k] = String(v);
    }
  }
  return next;
}
