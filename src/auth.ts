import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/neondb";
import { users } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

async function getUser(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.is_deleted, false)))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user || !user.password_hash) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password_hash);
          if (passwordsMatch) {
            return { id: user.id, email: user.email, name: user.name };
          }
        }
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
