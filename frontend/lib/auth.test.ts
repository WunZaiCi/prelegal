// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  authHeader,
  getMe,
  getToken,
  isAuthed,
  login,
  logout,
  register,
} from "./auth";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("auth", () => {
  it("is not authed before signing in", () => {
    expect(isAuthed()).toBe(false);
    expect(authHeader()).toEqual({});
  });

  it("register stores the token and returns the user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: "t1", user: { id: 1, email: "a@b.com" } }),
      }),
    );
    const user = await register("a@b.com", "supersecret");
    expect(user).toEqual({ id: 1, email: "a@b.com" });
    expect(getToken()).toBe("t1");
    expect(isAuthed()).toBe(true);
    expect(authHeader()).toEqual({ Authorization: "Bearer t1" });
  });

  it("login surfaces the server's error detail and stores no token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Incorrect email or password." }),
      }),
    );
    await expect(login("a@b.com", "x")).rejects.toThrow(
      "Incorrect email or password.",
    );
    expect(isAuthed()).toBe(false);
  });

  it("getMe returns null without a token and never calls the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await getMe()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getMe clears an invalid token on 401", async () => {
    window.localStorage.setItem("prelegal_token", "bad");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );
    expect(await getMe()).toBeNull();
    expect(getToken()).toBeNull();
  });

  it("logout clears the token even if the request fails", async () => {
    window.localStorage.setItem("prelegal_token", "t");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await logout();
    expect(getToken()).toBeNull();
  });
});
