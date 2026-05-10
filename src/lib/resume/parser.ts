import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch {
    throw new Error('Could not read PDF — make sure it is not password protected');
  }
}

export async function extractSkillsFromText(
  resumeText: string,
  claudeClient: { messages: { create: (opts: object) => Promise<{ content: Array<{ type: string; text: string }> }> } }
): Promise<string[]> {
  try {
    const response = await claudeClient.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract technical skills from this resume. Return ONLY a JSON array of strings.
Example: ["Python", "React", "SQL", "Machine Learning"]

Resume:
${resumeText.slice(0, 3000)}

Return only the JSON array, nothing else.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}
