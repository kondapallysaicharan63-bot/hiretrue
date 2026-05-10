import { db } from '@/lib/neondb';
import { h1b_sponsors } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(inc|llc|ltd|corp|co|company)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function isH1BSponsor(companyName: string): Promise<boolean> {
  const normalized = normalizeCompanyName(companyName);
  const result = await db
    .select({ id: h1b_sponsors.id })
    .from(h1b_sponsors)
    .where(eq(h1b_sponsors.normalized_name, normalized))
    .limit(1);
  return result.length > 0;
}
