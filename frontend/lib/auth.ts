/**
 * Fake, frontend-only "auth" for the V1 foundation.
 *
 * There is no real authentication yet: a successful sign-in simply records a
 * flag in localStorage so the app can route the user into the platform and back
 * out again. This is a deliberate placeholder — real registration/login backed
 * by the API will replace it in a later ticket.
 */

const STORAGE_KEY = "prelegal_authed";

/** Whether the user has "signed in" during this browser session. */
export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage can throw in private-mode / sandboxed contexts.
    return false;
  }
}

/** Record a (fake) successful sign-in. */
export function signIn(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* no-op: nothing we can do if storage is unavailable */
  }
}

/** Clear the sign-in flag. */
export function signOut(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
