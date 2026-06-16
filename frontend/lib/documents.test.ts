import { describe, expect, it } from "vitest";
import {
  DOCUMENTS,
  emptyGenericData,
  getDocument,
  leafKeys,
  mergeGenericFields,
} from "./documents";

describe("documents registry", () => {
  it("includes the NDA (bespoke) and generic documents", () => {
    const nda = getDocument("mutual-nda");
    expect(nda?.kind).toBe("nda");
    expect(nda?.keyTerms).toBeUndefined();

    const partnership = getDocument("partnership-agreement");
    expect(partnership?.kind).toBe("generic");
    expect((partnership?.keyTerms?.length ?? 0)).toBeGreaterThan(0);
  });

  it("every generic document declares keyTerms; nda does not", () => {
    for (const d of DOCUMENTS) {
      if (d.kind === "generic") expect(d.keyTerms?.length).toBeGreaterThan(0);
      else expect(d.keyTerms).toBeUndefined();
    }
  });

  it("expands party fields into four leaf keys", () => {
    const spec = getDocument("partnership-agreement")!;
    const keys = leafKeys(spec);
    expect(keys).toContain("party1_company");
    expect(keys).toContain("party1_name");
    expect(keys).toContain("party1_title");
    expect(keys).toContain("party1_notice");
    expect(keys).toContain("purpose"); // non-party stays a single key
  });

  it("emptyGenericData has a blank for every leaf key", () => {
    const spec = getDocument("cloud-service-agreement")!;
    const data = emptyGenericData(spec);
    expect(Object.keys(data).sort()).toEqual(leafKeys(spec).sort());
    expect(Object.values(data).every((v) => v === "")).toBe(true);
  });

  it("merges only known, non-empty keys without mutating input", () => {
    const spec = getDocument("partnership-agreement")!;
    const base = emptyGenericData(spec);
    const snapshot = JSON.stringify(base);

    const out = mergeGenericFields(spec, base, {
      purpose: "Build things",
      party1_company: "Acme",
      bogusKey: "ignored",
      term: "",
    });

    expect(out.purpose).toBe("Build things");
    expect(out.party1_company).toBe("Acme");
    expect(out).not.toHaveProperty("bogusKey");
    expect(out.term).toBe(""); // blank update ignored
    expect(JSON.stringify(base)).toBe(snapshot); // input untouched
  });
});
