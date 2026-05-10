import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateInterviewPrep } from '@/lib/ai/interview-prep';
import { db } from '@/lib/neondb';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { title, company, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ error: 'title and description required' }, { status: 400 });
    }

    const [user] = await db.select({ resume_text: users.resume_text })
      .from(users).where(eq(users.id, session.user.id)).limit(1);

    const resumeText = user?.resume_text ?? '';

    const result = await generateInterviewPrep(resumeText, description, title, company ?? '');
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Interview prep failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
