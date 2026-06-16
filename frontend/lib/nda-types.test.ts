import { describe, expect, it } from "vitest";
import {
  defaultNdaData,
  describeConfidentiality,
  describeTerm,
  formatDate,
  todayIso,
  type NdaFormData,
} from "./nda-types";

const base = (): NdaFormData => defaultNdaData();

describe("formatDate", () => {
  it("formats an ISO date as a readable long date", () => {
    expect(formatDate("2026-06-15")).toBe("June 15, 2026");
  });

  it("returns an empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });

  it("returns the original string for an unparseable date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("is not shifted by timezone (renders the calendar day given)", () => {
    // Parsed at local midnight, so the day must not roll backwards/forwards.
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("describeTerm", () => {
  it("describes a multi-year term with a plural noun", () => {
    const data = { ...base(), termMode: "expires" as const, termYears: 3 };
    expect(describeTerm(data)).toBe("Expires 3 years from the Effective Date.");
  });

  it("uses the singular noun for a one-year term", () => {
    const data = { ...base(), termMode: "expires" as const, termYears: 1 };
    expect(describeTerm(data)).toBe("Expires 1 year from the Effective Date.");
  });

  it("describes an until-terminated term", () => {
    const data = { ...base(), termMode: "untilTerminated" as const };
    expect(describeTerm(data)).toBe(
      "Continues until terminated in accordance with the terms of the MNDA.",
    );
  });
});

describe("describeConfidentiality", () => {
  it("describes a multi-year confidentiality period with the trade-secret carve-out", () => {
    const data = {
      ...base(),
      confidentialityMode: "years" as const,
      confidentialityYears: 5,
    };
    expect(describeConfidentiality(data)).toBe(
      "5 years from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.",
    );
  });

  it("uses the singular noun for a one-year period", () => {
    const data = {
      ...base(),
      confidentialityMode: "years" as const,
      confidentialityYears: 1,
    };
    expect(describeConfidentiality(data)).toBe(
      "1 year from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.",
    );
  });

  it("describes a perpetual confidentiality period", () => {
    const data = { ...base(), confidentialityMode: "perpetuity" as const };
    expect(describeConfidentiality(data)).toBe("In perpetuity.");
  });
});

describe("defaultNdaData", () => {
  it("starts with a blank effective date so SSR/CSR markup is deterministic", () => {
    expect(defaultNdaData().effectiveDate).toBe("");
  });

  it("returns a fresh, independent object each call (no shared party refs)", () => {
    const a = defaultNdaData();
    const b = defaultNdaData();
    a.party1.company = "Acme";
    expect(b.party1.company).toBe("");
    expect(a.party1).not.toBe(b.party1);
  });

  it("seeds both parties as empty", () => {
    const d = defaultNdaData();
    for (const party of [d.party1, d.party2]) {
      expect(party).toEqual({
        company: "",
        printName: "",
        title: "",
        noticeAddress: "",
      });
    }
  });
});

describe("todayIso", () => {
  it("returns a yyyy-mm-dd string", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
