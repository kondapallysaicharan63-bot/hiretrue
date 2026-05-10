import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { extractTextFromPDF, extractSkillsFromText } from '@/lib/resume/parser';
import { claude } from '@/lib/ai/client';
import { db } from '@/lib/neondb';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractTextFromPDF(buffer);
    const skills = await extractSkillsFromText(resumeText, claude);

    await db
      .update(users)
      .set({ resume_text: resumeText, skills, updated_at: new Date() })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ success: true, skills, resumeText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
