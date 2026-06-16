/**
 * Client for the per-user saved-documents API (PL-7).
 * All calls carry the session token via `authHeader()`.
 */

import { authHeader } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export interface SavedDocumentSummary {
  id: number;
  docType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDocument extends SavedDocumentSummary {
  data: unknown;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  // 204 No Content (e.g. delete) has no body.
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function listDocuments(): Promise<SavedDocumentSummary[]> {
  return request("/api/documents");
}

export function getDocument(id: number): Promise<SavedDocument> {
  return request(`/api/documents/${id}`);
}

export function createDocument(input: {
  docType: string;
  title: string;
  data: unknown;
}): Promise<SavedDocument> {
  return request("/api/documents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDocument(
  id: number,
  input: { title: string; data: unknown },
): Promise<SavedDocument> {
  return request(`/api/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteDocument(id: number): Promise<void> {
  return request(`/api/documents/${id}`, { method: "DELETE" });
}
