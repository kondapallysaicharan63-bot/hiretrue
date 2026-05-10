import { extractEmail, requiresEmailApply } from '@/lib/scraper/email-extractor';

describe('extractEmail', () => {
  it('finds email in text', () => {
    expect(extractEmail('Send resume to jobs@company.com for consideration')).toBe('jobs@company.com');
  });

  it('returns null when no email present', () => {
    expect(extractEmail('Apply at our website')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractEmail('')).toBeNull();
  });

  it('filters out noreply emails', () => {
    expect(extractEmail('Contact noreply@company.com for info')).toBeNull();
  });

  it('filters out no-reply emails', () => {
    expect(extractEmail('Email no-reply@domain.com')).toBeNull();
  });

  it('filters out donotreply emails', () => {
    expect(extractEmail('Email donotreply@company.com')).toBeNull();
  });

  it('returns first valid email when multiple present', () => {
    const result = extractEmail('Email hr@company.com or noreply@company.com');
    expect(result).toBe('hr@company.com');
  });
});

describe('requiresEmailApply', () => {
  it('detects "email your resume"', () => {
    expect(requiresEmailApply('Please email your resume to our team')).toBe(true);
  });

  it('detects "send resume to"', () => {
    expect(requiresEmailApply('Please send resume to our HR department')).toBe(true);
  });

  it('detects careers@ pattern', () => {
    expect(requiresEmailApply('Apply via careers@company.com')).toBe(true);
  });

  it('detects hr@ pattern', () => {
    expect(requiresEmailApply('Send your application to hr@company.com')).toBe(true);
  });

  it('returns false for normal online application', () => {
    expect(requiresEmailApply('Apply online at our portal today')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(requiresEmailApply('')).toBe(false);
  });
});
