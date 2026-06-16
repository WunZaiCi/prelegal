import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import ChatPanel from "./ChatPanel";
import { defaultNdaData, type NdaFormData } from "@/lib/nda-types";

/** Harness mirroring how the page wires data <-> ChatPanel. */
function Harness() {
  const [data, setData] = useState<NdaFormData>(defaultNdaData);
  return (
    <>
      <ChatPanel data={data} onChange={setData} />
      <span data-testid="gov">{data.governingLaw}</span>
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatPanel", () => {
  it("shows the greeting on mount", () => {
    render(<Harness />);
    expect(screen.getByText(/I'll help you draft your Mutual NDA/i)).toBeInTheDocument();
  });

  it("sends a message, shows the reply, and applies extracted fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Great — using Delaware law.",
        fields: { governingLaw: "Delaware" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Message"), "Use Delaware law");
    await user.click(screen.getByRole("button", { name: /send/i }));

    // User message + assistant reply appear.
    expect(screen.getByText("Use Delaware law")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Great — using Delaware law.")).toBeInTheDocument(),
    );
    // Extracted field is merged into the shared data.
    expect(screen.getByTestId("gov")).toHaveTextContent("Delaware");

    // The request carried the conversation + current data.
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "Use Delaware law" });
    expect(body.data).toBeTruthy();
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
