import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { scoreJobMatch } from '@/lib/ai/match';
import { db } from '@/lib/neondb';
import { users, applications, jobs as jobsTable } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { jobId, title, description } = await req.json();
    if (!jobId || !description) {
      return NextResponse.json({ error: 'jobId and description required' }, { status: 400 });
    }

    // Get user's resume
    const [user] = await db.select({ resume_text: users.resume_text })
      .from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!user?.resume_text) {
      return NextResponse.json({ error: 'Please upload your resume first' }, { status: 400 });
    }

    const result = await scoreJobMatch(user.resume_text, description, title ?? '');

    // Save to application if exists
    const [app] = await db.select({ id: applications.id })
      .from(applications)
      .innerJoin(jobsTable, eq(applications.job_id, jobsTable.id))
      .where(and(
        eq(applications.user_id, session.user.id),
        eq(jobsTable.external_id, jobId)
      ))
      .limit(1);

    if (app) {
      await db.update(applications)
        .set({ match_score: result.score, match_reason: result.reason, updated_at: new Date() })
        .where(eq(applications.id, app.id));
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Match scoring failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
