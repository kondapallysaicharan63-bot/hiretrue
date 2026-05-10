import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { tailorResume } from '@/lib/ai/resume';
import { generateCoverLetter } from '@/lib/ai/cover-letter';
import { db } from '@/lib/neondb';
import { users, applications, jobs as jobsTable } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { jobId, company, title, description } = await req.json();
    if (!description || !title || !company) {
      return NextResponse.json({ error: 'title, company, and description required' }, { status: 400 });
    }

    const [user] = await db.select({ resume_text: users.resume_text })
      .from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!user?.resume_text) {
      return NextResponse.json({ error: 'Please upload your resume first' }, { status: 400 });
    }

    // Run both in parallel
    const [tailoredResume, coverLetter] = await Promise.all([
      tailorResume(user.resume_text, description, title, company),
      generateCoverLetter(user.resume_text, description, title, company),
    ]);

    // Persist to application if saved
    if (jobId) {
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
          .set({ tailored_resume: tailoredResume, cover_letter: coverLetter, updated_at: new Date() })
          .where(eq(applications.id, app.id));
      }
    }

    return NextResponse.json({ tailoredResume, coverLetter });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Tailoring failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
