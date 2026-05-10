import { hireTrueSignup, hireTrueAuthenticate } from "@/actions/hiretrue-auth.actions";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

vi.mock("@/auth", () => ({ signIn: vi.fn() }));

vi.mock("next-auth", () => {
  class MockAuthError extends Error {
    type: string;
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
      this.type = message;
    }
  }
  return { AuthError: MockAuthError };
});

// Drizzle db mock with configurable select results
const mockSelectResult: { id: string }[] = [];
const mockInsertValues = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/neondb", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(mockSelectResult)),
        })),
      })),
    })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
  },
}));

const validData = {
  name: "Sai Charan",
  email: "sai@example.com",
  password: "password123",
  visa_status: "f1",
};

describe("hireTrueSignup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
  });

  it("creates a new user successfully", async () => {
    const result = await hireTrueSignup(validData);
    expect(result).toEqual({ success: true });
    expect(mockInsertValues).toHaveBeenCalledOnce();
  });

  it("inserts with correct name, email, and visa_status", async () => {
    await hireTrueSignup(validData);
    const insertArg = mockInsertValues.mock.calls[0][0];
    expect(insertArg.name).toBe("Sai Charan");
    expect(insertArg.email).toBe("sai@example.com");
    expect(insertArg.visa_status).toBe("f1");
  });

  it("inserts a non-empty password_hash (never plain text)", async () => {
    await hireTrueSignup(validData);
    const insertArg = mockInsertValues.mock.calls[0][0];
    expect(insertArg.password_hash).toBeTruthy();
    expect(insertArg.password_hash).not.toBe("password123");
  });

  it("returns error when email already exists", async () => {
    mockSelectResult.push({ id: "existing-id" });
    const result = await hireTrueSignup(validData);
    expect(result).toEqual({ error: "An account with this email already exists." });
  });

  it("does not insert when email already exists", async () => {
    mockSelectResult.push({ id: "existing-id" });
    await hireTrueSignup(validData);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("returns error for name shorter than 2 chars", async () => {
    const result = await hireTrueSignup({ ...validData, name: "A" });
    expect(result).toEqual({ error: "Invalid form data." });
  });

  it("returns error for invalid email format", async () => {
    const result = await hireTrueSignup({ ...validData, email: "not-an-email" });
    expect(result).toEqual({ error: "Invalid form data." });
  });

  it("returns error for password shorter than 6 chars", async () => {
    const result = await hireTrueSignup({ ...validData, password: "12345" });
    expect(result).toEqual({ error: "Invalid form data." });
  });

  it("inserts null visa_status when not provided", async () => {
    await hireTrueSignup({ name: "Sai", email: "sai@ex.com", password: "pass123" });
    const insertArg = mockInsertValues.mock.calls[0][0];
    expect(insertArg.visa_status).toBeNull();
  });

  it("does not insert when name is missing", async () => {
    await hireTrueSignup({ ...validData, name: "" });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});

describe("hireTrueAuthenticate", () => {
  const makeFormData = (email: string, password: string) => {
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    return fd;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null on successful sign in", async () => {
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await hireTrueAuthenticate("", makeFormData("sai@example.com", "password123"));
    expect(result).toBeNull();
  });

  it("calls signIn with credentials and redirect:false", async () => {
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await hireTrueAuthenticate("", makeFormData("sai@example.com", "password123"));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "sai@example.com",
      password: "password123",
      redirect: false,
    });
  });

  it("returns 'Invalid credentials.' on CredentialsSignin error", async () => {
    (signIn as ReturnType<typeof vi.fn>).mockRejectedValue(new AuthError("CredentialsSignin"));
    const result = await hireTrueAuthenticate("", makeFormData("a@b.com", "wrong"));
    expect(result).toBe("Invalid credentials.");
  });

  it("returns 'Something went wrong.' on unknown AuthError", async () => {
    (signIn as ReturnType<typeof vi.fn>).mockRejectedValue(new AuthError("OAuthAccountNotLinked"));
    const result = await hireTrueAuthenticate("", makeFormData("a@b.com", "pass"));
    expect(result).toBe("Something went wrong.");
  });

  it("rethrows non-AuthError exceptions", async () => {
    (signIn as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
    await expect(hireTrueAuthenticate("", makeFormData("a@b.com", "pass"))).rejects.toThrow("Network error");
  });
});
