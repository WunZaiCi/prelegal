import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentsList from "./DocumentsList";
import type { SavedDocumentSummary } from "@/lib/api";

afterEach(() => vi.restoreAllMocks());

const docs: SavedDocumentSummary[] = [
  {
    id: 1,
    docType: "mutual-nda",
    title: "Acme NDA",
    createdAt: "2026-06-01 10:00:00",
    updatedAt: "2026-06-02 10:00:00",
  },
  {
    id: 2,
    docType: "partnership-agreement",
    title: "Acme × Globex",
    createdAt: "2026-06-03 10:00:00",
    updatedAt: "2026-06-03 10:00:00",
  },
];

describe("DocumentsList", () => {
  it("renders an empty state when there are no documents", () => {
    render(<DocumentsList documents={[]} onOpen={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/No saved documents yet/i)).toBeInTheDocument();
  });

  it("lists documents with their type name", () => {
    render(<DocumentsList documents={docs} onOpen={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Acme NDA")).toBeInTheDocument();
    expect(screen.getByText(/Mutual NDA/)).toBeInTheDocument();
    expect(screen.getByText(/Partnership Agreement/)).toBeInTheDocument();
  });

  it("fires onOpen and onDelete with the document id", async () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <DocumentsList documents={docs} onOpen={onOpen} onDelete={onDelete} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Open" })[0]);
    expect(onOpen).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Delete Acme NDA" }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
