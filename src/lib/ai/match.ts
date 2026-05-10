import { claude, MODEL, MAX_TOKENS } from './client';

export async function scoreJobMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle: string
): Promise<{ score: number; reason: string; gaps: string[] }> {
  try {
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

Respond ONLY with a JSON object (no markdown):
{
  "score": <number 0-100>,
  "reason": "<2 sentences explaining the fit>",
  "gaps": ["<missing skill or experience>"]
}

Be honest. Score 70+ only if they genuinely match 70%+ of requirements.`,
      }],
    });

    if (response.content[0].type !== 'text') {
      return { score: 0, reason: 'Could not evaluate match.', gaps: [] };
    }
    try {
      const parsed = JSON.parse(response.content[0].text);
      if (typeof parsed.score !== 'number') return { score: 0, reason: 'Could not evaluate match.', gaps: [] };
      return parsed;
    } catch {
      return { score: 0, reason: 'Could not evaluate match.', gaps: [] };
    }
  } catch {
    return { score: 0, reason: 'Could not evaluate match.', gaps: [] };
  }
}
