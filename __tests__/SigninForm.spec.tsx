import { hireTrueAuthenticate } from "@/actions/hiretrue-auth.actions";
import SigninForm from "@/components/auth/SigninForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

vi.mock("@/actions/hiretrue-auth.actions", () => ({
  hireTrueAuthenticate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("SigninForm Component", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    (useRouter as any).mockReturnValue({ push: mockPush });
    render(<SigninForm />);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the SigninForm component correctly", () => {
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should display invalid email error", async () => {
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email.")
      ).toBeInTheDocument();
    });
  });

  it("should display number of characters invalid error", async () => {
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ad" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Email must be at least 3 characters.")
      ).toBeInTheDocument();
    });
    expect(hireTrueAuthenticate).not.toHaveBeenCalled();
  });

  it("submits the form successfully", async () => {
    (hireTrueAuthenticate as any).mockResolvedValueOnce(null);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(hireTrueAuthenticate).toHaveBeenCalledWith("", expect.any(FormData));
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows an error message on failed submit", async () => {
    const errorMessage = "Invalid credentials";
    (hireTrueAuthenticate as any).mockResolvedValueOnce(errorMessage);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(hireTrueAuthenticate).toHaveBeenCalledWith("", expect.any(FormData));
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
