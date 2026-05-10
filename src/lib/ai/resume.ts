import { claude, MODEL } from './client';

export async function tailorResume(
  originalResume: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  try {
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an expert resume writer. Tailor this resume for the job below.

RULES (follow strictly):
- Write naturally, like a human — NOT keyword-stuffed
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

Return ONLY the tailored resume text. No explanation, no commentary.`,
      }],
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : originalResume;
  } catch {
    return originalResume;
  }
}
