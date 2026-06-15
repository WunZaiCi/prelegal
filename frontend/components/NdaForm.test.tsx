import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";
import NdaForm from "./NdaForm";

/** Controlled harness so the form behaves as it does in the real page. */
function Harness() {
  const [data, setData] = useState<NdaFormData>(defaultNdaData);
  return <NdaForm data={data} onChange={setData} />;
}

/** Find the <label> wrapper for a Field by its visible label text. */
function field(labelText: string): HTMLElement {
  const node = screen.getByText(labelText).closest("label");
  if (!node) throw new Error(`No field labelled "${labelText}"`);
  return node;
}

describe("NdaForm — MNDA Term", () => {
  it("shows the year stepper for a term that expires (the default)", () => {
    render(<Harness />);
    const term = field("MNDA Term");
    expect(within(term).getByText("year")).toBeInTheDocument(); // singular at 1
  });

  it("hides the year stepper when the term continues until terminated", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const term = field("MNDA Term");
    await user.click(within(term).getByText("Continues until terminated"));
    expect(within(term).queryByLabelText("Increase")).not.toBeInTheDocument();
  });

  it("increments the term and switches to the plural noun", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const term = field("MNDA Term");
    await user.click(within(term).getByLabelText("Increase"));
    expect(term).toHaveTextContent("2");
    expect(within(term).getByText("years")).toBeInTheDocument();
  });

  it("does not decrement below the minimum of 1", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const term = field("MNDA Term");
    await user.click(within(term).getByLabelText("Decrease"));
    expect(term).toHaveTextContent("1");
    expect(within(term).getByText("year")).toBeInTheDocument();
  });
});

describe("NdaForm — Term of Confidentiality", () => {
  it("shows the year stepper by default and hides it for perpetuity", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const conf = field("Term of Confidentiality");
    expect(within(conf).getByLabelText("Increase")).toBeInTheDocument();
    await user.click(within(conf).getByText("In perpetuity"));
    expect(within(conf).queryByLabelText("Increase")).not.toBeInTheDocument();
  });
});

describe("NdaForm — text fields", () => {
  it("edits a top-level text field (Governing Law)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByPlaceholderText("Delaware");
    await user.type(input, "California");
    expect(input).toHaveValue("California");
  });

  it("edits a party-scoped field without affecting the other party", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const party1 = screen.getByText("Party 1").closest("fieldset") as HTMLElement;
    const party2 = screen.getByText("Party 2").closest("fieldset") as HTMLElement;

    await user.type(within(party1).getByLabelText("Company"), "Acme, Inc.");

    expect(within(party1).getByLabelText("Company")).toHaveValue("Acme, Inc.");
    expect(within(party2).getByLabelText("Company")).toHaveValue("");
  });
});
