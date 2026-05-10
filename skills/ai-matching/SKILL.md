# Skill: AI — Claude API (Matching + Resume Tailoring)
> Read MASTER-SKILL.md first.

## What This Skill Covers
All Claude API interactions: job matching, resume tailoring, cover letter generation, interview prep.

## Setup
```bash
npm install @anthropic-ai/sdk
```

## File: lib/ai/client.ts
```typescript
import Anthropic from '@anthropic-ai/sdk';

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL = 'claude-haiku-4-5'; // fast + cheap
export const MAX_TOKENS = 1500;
```

## File: lib/ai/match.ts — Job Match Scoring
```typescript
import { claude, MODEL, MAX_TOKENS } from './client';

export async function scoreJobMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle: string
): Promise<{ score: number; reason: string; gaps: string[] }> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{
      role: 'user',
      content: `You are a recruiter evaluating a candidate for a job.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

CANDIDATE RESUME:
${resumeText.slice(0, 2000)}

Respond ONLY with a JSON object (no markdown, no explanation outside JSON):
{
  "score": <number 0-100>,
  "reason": "<2 sentences explaining why they are or aren't a good fit>",
  "gaps": ["<skill or experience they're missing>", ...]
}

Be honest. Score 70+ only if they genuinely match 70%+ of requirements.`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { score: 0, reason: 'Could not evaluate match.', gaps: [] };
  }
}
```

## File: lib/ai/resume.ts — Resume Tailoring
```typescript
import { claude, MODEL, MAX_TOKENS } from './client';

export async function tailorResume(
  originalResume: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are an expert resume writer. Tailor this resume for the job below.

RULES (follow strictly):
- Write naturally, like a human wrote it — NOT keyword-stuffed
- Keep the same structure but emphasize relevant experience
- Only highlight skills that genuinely match the job
- Do NOT invent experience that isn't in the original resume
- Keep it to 1 page worth of content
- Use strong action verbs

JOB: ${jobTitle} at ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

ORIGINAL RESUME:
${originalResume.slice(0, 2000)}

Return ONLY the tailored resume text. No explanation, no commentary.`
    }]
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : originalResume;
}
```

## File: lib/ai/cover-letter.ts
```typescript
import { claude, MODEL, MAX_TOKENS } from './client';

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{
      role: 'user',
      content: `Write a cover letter for this job application.

RULES:
- 3 short paragraphs max
- Sound like a real person, not AI
- Specific to this company and role
- Do NOT use phrases like "I am writing to express my interest"
- End with a clear call to action

JOB: ${jobTitle} at ${company}
DESCRIPTION: ${jobDescription.slice(0, 1000)}
RESUME: ${resumeText.slice(0, 1500)}

Return only the cover letter text.`
    }]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

## File: lib/ai/interview-prep.ts
```typescript
import { claude, MODEL, MAX_TOKENS } from './client';

export async function generateInterviewPrep(
  resumeText: string,
  jobDescription: string,
  jobTitle: string
): Promise<{ questions: string[]; tips: string[] }> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{
      role: 'user',
      content: `Generate interview prep for this job.

JOB: ${jobTitle}
DESCRIPTION: ${jobDescription.slice(0, 1000)}
RESUME: ${resumeText.slice(0, 1000)}

Respond ONLY with JSON:
{
  "questions": ["<likely interview question>", ...], // 8 questions
  "tips": ["<specific tip for this role>", ...]      // 4 tips
}`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { questions: [], tips: [] };
  }
}
```

## Cost Tracking
- claude-haiku-4-5: $0.00025 per 1K input tokens, $0.00125 per 1K output tokens
- Average resume tailor call: ~2K tokens total = ~$0.001
- 1000 tailored resumes = ~$1.00
- Monthly budget for 50 beta users doing 20 tailors each = ~$1.00

## Rules
- ALWAYS use try/catch around every Claude call
- ALWAYS have a fallback if Claude fails (return original, show error)
- NEVER call Claude in tests — use mock responses
- NEVER send full resume if >4000 chars — slice to 2000
- ALWAYS parse JSON responses with try/catch

