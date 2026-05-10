# Skill: Resume Parser (PDF → Text → Skills)
> Read MASTER-SKILL.md first.

## What This Skill Covers
Uploading resumes (PDF/DOCX), extracting text, and parsing skills with Claude.

## Setup
```bash
npm install pdf-parse multer
npm install -D @types/multer
```

## File: lib/resume/parser.ts
```typescript
import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Could not read PDF — make sure it is not password protected');
  }
}

export async function extractSkillsFromText(
  resumeText: string,
  claudeClient: any
): Promise<string[]> {
  const response = await claudeClient.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Extract technical skills from this resume. Return ONLY a JSON array of strings.
Example: ["Python", "React", "SQL", "Machine Learning"]

Resume:
${resumeText.slice(0, 3000)}

Return only the JSON array, nothing else.`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
```

## API Route: app/api/resume/upload/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, extractSkillsFromText } from '@/lib/resume/parser';
import { claude } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files supported' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractTextFromPDF(buffer);
    const skills = await extractSkillsFromText(resumeText, claude);

    // Save to DB
    await db.update(users)
      .set({ resume_text: resumeText, skills, updated_at: new Date() })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ success: true, skills, resumeText });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Rules
- Max file size: 5MB
- Only accept PDF (for now — DOCX in v2)
- Always extract plain text — never store the raw PDF in DB
- Always show extracted skills to user so they can verify
- If PDF parse fails — show clear error message, not generic 500

