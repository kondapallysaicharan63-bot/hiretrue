import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai/client', () => ({
  claude: { messages: { create: mockCreate } },
  MODEL: 'claude-haiku-4-5',
  MAX_TOKENS: 1500,
}));

import { generateInterviewPrep } from '@/lib/ai/interview-prep';

describe('generateInterviewPrep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns questions and tips on success', async () => {
    const payload = {
      questions: ['Tell me about yourself', 'Why this role?'],
      tips: ['Research the company', 'Prepare STAR stories'],
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(payload) }],
    });

    const result = await generateInterviewPrep('resume', 'job desc', 'Engineer', 'Acme');
    expect(result.questions).toHaveLength(2);
    expect(result.tips).toHaveLength(2);
    expect(result.questions[0]).toBe('Tell me about yourself');
  });

  it('returns empty arrays on JSON parse error', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not valid json' }],
    });

    const result = await generateInterviewPrep('resume', 'desc', 'title', 'company');
    expect(result.questions).toEqual([]);
    expect(result.tips).toEqual([]);
  });

  it('returns empty arrays on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await generateInterviewPrep('resume', 'desc', 'title', 'company');
    expect(result.questions).toEqual([]);
    expect(result.tips).toEqual([]);
  });

  it('returns empty arrays when content is not text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const result = await generateInterviewPrep('resume', 'desc', 'title', 'company');
    expect(result.questions).toEqual([]);
    expect(result.tips).toEqual([]);
  });

  it('works with empty company name', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ questions: ['Q1'], tips: ['T1'] }) }],
    });

    const result = await generateInterviewPrep('resume', 'desc', 'title', '');
    expect(result.questions).toEqual(['Q1']);
  });

  it('handles partial response gracefully', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ questions: ['Q1'] }) }],
    });

    const result = await generateInterviewPrep('resume', 'desc', 'title', 'company');
    expect(result.questions).toEqual(['Q1']);
  });
});
