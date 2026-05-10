import { claude, MODEL, MAX_TOKENS } from './client';

export async function generateInterviewPrep(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<{ questions: string[]; tips: string[] }> {
  try {
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: `Generate interview prep for this job.

JOB: ${jobTitle} at ${company}
DESCRIPTION: ${jobDescription.slice(0, 1000)}
RESUME: ${resumeText.slice(0, 1000)}

Respond ONLY with JSON:
{
  "questions": ["<likely interview question>"],
  "tips": ["<specific tip for this role>"]
}

Include exactly 8 questions and 4 tips.`,
      }],
    });

    if (response.content[0].type !== 'text') {
      return { questions: [], tips: [] };
    }
    try {
      const parsed = JSON.parse(response.content[0].text);
      return {
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      };
    } catch {
      return { questions: [], tips: [] };
    }
  } catch {
    return { questions: [], tips: [] };
  }
}
