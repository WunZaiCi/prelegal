import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import AuthForm from "./AuthForm";
import { login, register } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe("AuthForm", () => {
  it("registers and reports the signed-in user", async () => {
    (register as Mock).mockResolvedValue({ id: 1, email: "a@b.com" });
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<AuthForm mode="register" onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({ id: 1, email: "a@b.com" }),
    );
    expect(register).toHaveBeenCalledWith("a@b.com", "supersecret");
  });

  it("shows the error message when login fails", async () => {
    (login as Mock).mockRejectedValue(
      new Error("Incorrect email or password."),
    );
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<AuthForm mode="login" onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Incorrect email or password.",
      ),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
