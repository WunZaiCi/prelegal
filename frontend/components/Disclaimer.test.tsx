import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Disclaimer from "./Disclaimer";

describe("Disclaimer", () => {
  it("warns that documents are drafts needing legal review", () => {
    render(<Disclaimer />);
    expect(screen.getByText(/Draft only/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reviewed by a qualified lawyer/i),
    ).toBeInTheDocument();
  });
});
