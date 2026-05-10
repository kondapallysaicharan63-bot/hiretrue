import { extractTextFromPDF, extractSkillsFromText } from '@/lib/resume/parser';

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

import pdfParse from 'pdf-parse';

describe('extractTextFromPDF', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns extracted text from PDF buffer', async () => {
    (pdfParse as ReturnType<typeof vi.fn>).mockResolvedValue({ text: 'John Doe\nPython React SQL' });
    const result = await extractTextFromPDF(Buffer.from('fake'));
    expect(result).toBe('John Doe\nPython React SQL');
  });

  it('throws clear error when PDF parsing fails', async () => {
    (pdfParse as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('corrupted'));
    await expect(extractTextFromPDF(Buffer.from('bad'))).rejects.toThrow(
      'Could not read PDF — make sure it is not password protected'
    );
  });
});

describe('extractSkillsFromText', () => {
  const mockClaude = {
    messages: {
      create: vi.fn(),
    },
  };

  beforeEach(() => vi.clearAllMocks());

  it('returns skills array parsed from Claude response', async () => {
    mockClaude.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: '["Python", "React", "SQL"]' }],
    });
    const result = await extractSkillsFromText('resume text', mockClaude);
    expect(result).toEqual(['Python', 'React', 'SQL']);
  });

  it('returns empty array when Claude returns invalid JSON', async () => {
    mockClaude.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'not json' }],
    });
    const result = await extractSkillsFromText('resume text', mockClaude);
    expect(result).toEqual([]);
  });

  it('returns empty array when Claude returns non-text content', async () => {
    mockClaude.messages.create.mockResolvedValue({
      content: [{ type: 'image', text: '' }],
    });
    const result = await extractSkillsFromText('resume text', mockClaude);
    expect(result).toEqual([]);
  });

  it('returns empty array when Claude call fails', async () => {
    mockClaude.messages.create.mockRejectedValue(new Error('API error'));
    const result = await extractSkillsFromText('resume text', mockClaude);
    expect(result).toEqual([]);
  });
});
