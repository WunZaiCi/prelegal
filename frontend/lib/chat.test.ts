import { describe, expect, it } from "vitest";
import { mergeFields, type ExtractedFields } from "./chat";
import { defaultNdaData } from "./nda-types";

describe("mergeFields", () => {
  it("overrides only the provided scalar fields", () => {
    const base = defaultNdaData();
    const out = mergeFields(base, {
      governingLaw: "Delaware",
      termYears: 3,
    });
    expect(out.governingLaw).toBe("Delaware");
    expect(out.termYears).toBe(3);
    // Untouched fields keep their original values.
    expect(out.purpose).toBe(base.purpose);
    expect(out.confidentialityYears).toBe(base.confidentialityYears);
  });

  it("merges party fields without clobbering the other party or unset keys", () => {
    const base = defaultNdaData();
    base.party1.title = "CEO"; // pre-existing value
    const out = mergeFields(base, {
      party1: { company: "Acme, Inc.", printName: "Jane Doe" },
      party2: { company: "Globex Corp" },
    });
    expect(out.party1.company).toBe("Acme, Inc.");
    expect(out.party1.printName).toBe("Jane Doe");
    expect(out.party1.title).toBe("CEO"); // not overwritten
    expect(out.party2.company).toBe("Globex Corp");
    expect(out.party2.printName).toBe(""); // untouched
  });

  it("ignores null/undefined values", () => {
    const base = defaultNdaData();
    const fields: ExtractedFields = {
      purpose: undefined,
      governingLaw: undefined,
    };
    const out = mergeFields(base, fields);
    expect(out.purpose).toBe(base.purpose);
    expect(out.governingLaw).toBe(base.governingLaw);
  });

  it("does not mutate the input data", () => {
    const base = defaultNdaData();
    const snapshot = JSON.stringify(base);
    mergeFields(base, { governingLaw: "Texas", party1: { company: "X" } });
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});
