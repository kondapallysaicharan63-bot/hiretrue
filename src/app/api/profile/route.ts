import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/neondb';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [user] = await db
    .select({
      name: users.name,
      visa_status: users.visa_status,
      opt_end_date: users.opt_end_date,
      target_roles: users.target_roles,
      target_locations: users.target_locations,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json(user ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, visa_status, opt_end_date, target_roles, target_locations } = await req.json();

    await db
      .update(users)
      .set({
        name: name ?? undefined,
        visa_status: visa_status ?? undefined,
        opt_end_date: opt_end_date ? new Date(opt_end_date) : null,
        target_roles: Array.isArray(target_roles) ? target_roles : undefined,
        target_locations: Array.isArray(target_locations) ? target_locations : undefined,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
