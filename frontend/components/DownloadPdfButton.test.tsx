import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";
import { buildFilename } from "./DownloadPdfButton";

const withCompanies = (a: string, b: string): NdaFormData => {
  const data = defaultNdaData();
  data.party1.company = a;
  data.party2.company = b;
  return data;
};

describe("buildFilename", () => {
  it("joins both company names", () => {
    expect(buildFilename(withCompanies("Acme Inc", "Globex"))).toBe(
      "Mutual-NDA_Acme-Inc_and_Globex.pdf",
    );
  });

  it("falls back to a generic name when no companies are given", () => {
    expect(buildFilename(defaultNdaData())).toBe("Mutual-NDA.pdf");
  });

  it("uses just one party when only one company is given", () => {
    expect(buildFilename(withCompanies("Acme", ""))).toBe(
      "Mutual-NDA_Acme.pdf",
    );
  });

  it("strips characters that are unsafe in filenames", () => {
    expect(buildFilename(withCompanies("Acme, Inc.", "Foo/Bar"))).toBe(
      "Mutual-NDA_Acme-Inc_and_FooBar.pdf",
    );
  });

  it("truncates very long company names to 40 characters", () => {
    const long = "A".repeat(60);
    const name = buildFilename(withCompanies(long, ""));
    expect(name).toBe(`Mutual-NDA_${"A".repeat(40)}.pdf`);
  });
});
