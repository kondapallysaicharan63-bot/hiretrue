import { claude, MODEL, MAX_TOKENS } from './client';

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  try {
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

Return only the cover letter text.`,
      }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch {
    return '';
  }
}
