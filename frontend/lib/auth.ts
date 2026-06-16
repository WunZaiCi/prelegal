/**
 * Real authentication client (PL-7).
 *
 * Talks to the backend auth API and keeps an opaque session token in
 * localStorage. `isAuthed()` is a cheap synchronous gate (is a token present?)
 * used for client-side routing; `getMe()` validates the token against the API.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const TOKEN_KEY = "prelegal_token";

export interface User {
  id: number;
  email: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* no-op: storage unavailable */
  }
}

function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* no-op */
  }
}

/** Whether a session token is present (cheap, synchronous routing gate). */
export function isAuthed(): boolean {
  return getToken() !== null;
}

/** Authorization header for authenticated API calls (empty when signed out). */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body?.detail) {
      // FastAPI 422s can return an array of errors; take the first message.
      if (Array.isArray(body.detail)) return body.detail[0]?.msg ?? fallback;
      return body.detail;
    }
  } catch {
    /* non-JSON body */
  }
  return fallback;
}

async function authRequest(
  path: string,
  email: string,
  password: string,
): Promise<User> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Something went wrong."));
  }
  const { token, user } = await res.json();
  setToken(token);
  return user;
}

export function register(email: string, password: string): Promise<User> {
  return authRequest("/api/auth/register", email, password);
}

export function login(email: string, password: string): Promise<User> {
  return authRequest("/api/auth/login", email, password);
}

/** Clear the session both server-side and locally. Always clears locally. */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: authHeader(),
    });
  } catch {
    /* even if the call fails, drop the local token below */
  }
  clearToken();
}

/** Resolve the current user from the stored token, or null if not signed in. */
export async function getMe(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: authHeader(),
    });
    if (!res.ok) {
      if (res.status === 401) clearToken();
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}
