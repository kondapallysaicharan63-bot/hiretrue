import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai/client', () => ({
  claude: { messages: { create: mockCreate } },
  MODEL: 'claude-haiku-4-5',
  MAX_TOKENS: 1500,
}));

import { scoreJobMatch } from '@/lib/ai/match';

describe('scoreJobMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns score, reason, and gaps on success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ score: 85, reason: 'Strong match', gaps: ['Leadership'] }) }],
    });

    const result = await scoreJobMatch('resume text', 'job description', 'Software Engineer');
    expect(result.score).toBe(85);
    expect(result.reason).toBe('Strong match');
    expect(result.gaps).toEqual(['Leadership']);
  });

  it('returns default on JSON parse error', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json' }],
    });

    const result = await scoreJobMatch('resume', 'desc', 'title');
    expect(result.score).toBe(0);
    expect(result.reason).toBe('Could not evaluate match.');
    expect(result.gaps).toEqual([]);
  });

  it('returns default on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await scoreJobMatch('resume', 'desc', 'title');
    expect(result.score).toBe(0);
    expect(result.reason).toBe('Could not evaluate match.');
  });

  it('returns default when content type is not text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const result = await scoreJobMatch('resume', 'desc', 'title');
    expect(result.score).toBe(0);
  });

  it('score is within valid range', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ score: 72, reason: 'Good', gaps: [] }) }],
    });

    const result = await scoreJobMatch('resume', 'desc', 'title');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('works with empty resume text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ score: 10, reason: 'No resume', gaps: ['Everything'] }) }],
    });

    const result = await scoreJobMatch('', 'job desc', 'title');
    expect(result.score).toBe(10);
  });
});
