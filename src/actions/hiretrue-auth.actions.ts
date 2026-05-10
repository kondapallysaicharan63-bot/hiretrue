"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/neondb";
import { users } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { HireTrueSignupSchema } from "@/models/hiretrue-signup.schema";

export async function hireTrueSignup(formData: {
  name: string;
  email: string;
  password: string;
  visa_status?: string;
}) {
  const parsed = HireTrueSignupSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data." };
  }

  const { name, email, password, visa_status } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.is_deleted, false)))
    .limit(1);

  if (existing.length > 0) {
    return { error: "An account with this email already exists." };
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name,
    email,
    password_hash,
    visa_status: visa_status ?? null,
  });

  return { success: true };
}

export async function hireTrueAuthenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
