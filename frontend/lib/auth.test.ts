// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { isAuthed, signIn, signOut } from "./auth";

afterEach(() => {
  window.localStorage.clear();
});

describe("auth (fake, frontend-only)", () => {
  it("reports not authed before signing in", () => {
    expect(isAuthed()).toBe(false);
  });

  it("reports authed after signIn()", () => {
    signIn();
    expect(isAuthed()).toBe(true);
  });

  it("clears the flag on signOut()", () => {
    signIn();
    signOut();
    expect(isAuthed()).toBe(false);
  });
});
