import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai/client', () => ({
  claude: { messages: { create: mockCreate } },
  MODEL: 'claude-haiku-4-5',
  MAX_TOKENS: 1500,
}));

import { tailorResume } from '@/lib/ai/resume';
import { generateCoverLetter } from '@/lib/ai/cover-letter';

describe('tailorResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tailored resume on success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Tailored resume content here' }],
    });

    const result = await tailorResume('original resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('Tailored resume content here');
  });

  it('returns original resume on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await tailorResume('original resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('original resume');
  });

  it('returns original resume when content is not text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const result = await tailorResume('original resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('original resume');
  });

  it('truncates long inputs before sending to Claude', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Tailored output' }],
    });

    const longResume = 'a'.repeat(5000);
    const longDesc = 'b'.repeat(5000);
    const result = await tailorResume(longResume, longDesc, 'title', 'company');
    expect(result).toBe('Tailored output');
    expect(mockCreate).toHaveBeenCalledOnce();
  });
});

describe('generateCoverLetter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cover letter on success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Cover letter content' }],
    });

    const result = await generateCoverLetter('resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('Cover letter content');
  });

  it('returns empty string on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await generateCoverLetter('resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('');
  });

  it('returns empty string when content type is not text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const result = await generateCoverLetter('resume', 'job desc', 'Engineer', 'Acme');
    expect(result).toBe('');
  });
});
