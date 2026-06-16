import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  it("renders email and password fields and a Continue button", () => {
    render(<LoginForm onSignIn={() => {}} />);
    expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it("calls onSignIn when the form is submitted", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<LoginForm onSignIn={onSignIn} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("lets the user type without requiring real credentials", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<LoginForm onSignIn={onSignIn} />);

    await user.type(screen.getByPlaceholderText("you@company.com"), "a@b.com");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});
