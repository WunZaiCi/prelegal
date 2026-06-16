import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import ChatPanel from "./ChatPanel";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";
import type { GenericDocData } from "@/lib/documents";

/** Harness mirroring how the page wires lifted state <-> ChatPanel. */
function Harness() {
  const [docType, setDocType] = useState<string | null>(null);
  const [ndaData, setNdaData] = useState<NdaFormData>(defaultNdaData);
  const [genericData, setGenericData] = useState<GenericDocData>({});
  return (
    <>
      <ChatPanel
        docType={docType}
        onDocTypeChange={setDocType}
        ndaData={ndaData}
        onNdaData={setNdaData}
        genericData={genericData}
        onGenericData={setGenericData}
      />
      <span data-testid="doctype">{docType ?? ""}</span>
      <span data-testid="gov">{ndaData.governingLaw}</span>
      <span data-testid="generic">{JSON.stringify(genericData)}</span>
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatPanel", () => {
  it("shows the greeting on mount", () => {
    render(<Harness />);
    expect(
      screen.getByText(/help you draft a legal document/i),
    ).toBeInTheDocument();
  });

  it("selects the NDA and applies extracted NDA fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Let's draft your Mutual NDA — using Delaware law.",
        docType: "mutual-nda",
        ndaFields: { governingLaw: "Delaware" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Message"), "I need an NDA");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByTestId("doctype")).toHaveTextContent("mutual-nda"),
    );
    expect(screen.getByTestId("gov")).toHaveTextContent("Delaware");

    // First request is in selection mode: docType null, no document data.
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.docType).toBeNull();
    expect(body.data).toBeNull();
    expect(body.messages.at(-1)).toEqual({
      role: "user",
      content: "I need an NDA",
    });
  });

  it("selects a generic document and applies its fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reply: "A Partnership Agreement it is.",
          docType: "partnership-agreement",
          fields: { purpose: "Build a joint product" },
        }),
      }),
    );

    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Message"), "partnership");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByTestId("doctype")).toHaveTextContent(
        "partnership-agreement",
      ),
    );
    expect(screen.getByTestId("generic")).toHaveTextContent(
      "Build a joint product",
    );
  });

  it("surfaces a friendly error when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: "AI chat is unavailable." }),
      }),
    );

    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText("Message"), "hello");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText("AI chat is unavailable.")).toBeInTheDocument(),
    );
  });
});
