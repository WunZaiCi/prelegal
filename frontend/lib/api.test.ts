// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument, deleteDocument, listDocuments } from "./api";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("documents api", () => {
  it("attaches the bearer token and parses JSON", async () => {
    window.localStorage.setItem("prelegal_token", "tok");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, docType: "mutual-nda", title: "t", createdAt: "", updatedAt: "" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const docs = await listDocuments();
    expect(docs).toHaveLength(1);
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("createDocument POSTs the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 5,
        docType: "d",
        title: "t",
        data: {},
        createdAt: "",
        updatedAt: "",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const doc = await createDocument({ docType: "d", title: "t", data: { a: 1 } });
    expect(doc.id).toBe(5);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/documents");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ docType: "d", title: "t", data: { a: 1 } });
  });

  it("returns undefined for a 204 delete", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    await expect(deleteDocument(1)).resolves.toBeUndefined();
  });

  it("throws the server's error detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Document not found." }),
      }),
    );
    await expect(listDocuments()).rejects.toThrow("Document not found.");
  });
});
