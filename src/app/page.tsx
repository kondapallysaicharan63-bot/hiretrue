import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/neondb";
import { users } from "@/drizzle/schema";
import { count } from "drizzle-orm";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/jobs");
  }

  const [result] = await db.select({ c: count() }).from(users);

  if (result.c === 0) {
    redirect("/signup");
  } else {
    redirect("/signin");
  }
}
