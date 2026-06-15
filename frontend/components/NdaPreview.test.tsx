import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";
import { STANDARD_TERMS } from "@/lib/standard-terms";
import NdaPreview from "./NdaPreview";

const filled = (overrides: Partial<NdaFormData> = {}): NdaFormData => ({
  ...defaultNdaData(),
  effectiveDate: "2026-06-15",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  party1: {
    company: "Acme, Inc.",
    printName: "Jane Doe",
    title: "CEO",
    noticeAddress: "legal@acme.com",
  },
  ...overrides,
});

describe("NdaPreview — Standard Terms", () => {
  it("renders all 11 clauses", () => {
    render(<NdaPreview data={defaultNdaData()} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(11);
  });

  it("renders every clause title", () => {
    const { container } = render(<NdaPreview data={defaultNdaData()} />);
    for (const clause of STANDARD_TERMS) {
      expect(container).toHaveTextContent(`${clause.number}. ${clause.title}.`);
    }
  });

  it("renders the full body text of the first and last clauses", () => {
    const { container } = render(<NdaPreview data={defaultNdaData()} />);
    expect(container).toHaveTextContent(STANDARD_TERMS[0].body);
    expect(container).toHaveTextContent(STANDARD_TERMS[10].body);
  });
});

describe("NdaPreview — Cover Page values", () => {
  it("shows bracketed placeholders for empty fields", () => {
    render(<NdaPreview data={defaultNdaData()} />);
    expect(screen.getByText("[State]")).toBeInTheDocument();
    expect(screen.getByText("[City/county and state]")).toBeInTheDocument();
    expect(screen.getByText("[None]")).toBeInTheDocument();
  });

  it("shows entered values and drops the placeholder", () => {
    render(<NdaPreview data={filled()} />);
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    expect(screen.getByText("New Castle, DE")).toBeInTheDocument();
    expect(screen.queryByText("[State]")).not.toBeInTheDocument();
  });

  it("formats the effective date as a long date", () => {
    render(<NdaPreview data={filled()} />);
    expect(screen.getByText("June 15, 2026")).toBeInTheDocument();
  });

  it("renders the derived MNDA Term description", () => {
    const { container } = render(
      <NdaPreview data={filled({ termMode: "expires", termYears: 2 })} />,
    );
    expect(container).toHaveTextContent("Expires 2 years from the Effective Date.");
  });

  it("renders party details in the signature table", () => {
    render(<NdaPreview data={filled()} />);
    expect(screen.getByText("Acme, Inc.")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
