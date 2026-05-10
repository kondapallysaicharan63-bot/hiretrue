# Skill: Testing (Vitest + Playwright)
> Read MASTER-SKILL.md first.

## What This Skill Covers
Unit testing (Vitest) and End-to-End testing (Playwright) for HireTrue.

## Setup
```bash
npm install -D vitest @vitejs/plugin-react playwright @playwright/test
npx playwright install
```

## File: vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

## File: tests/setup.ts
```typescript
import { vi } from 'vitest';

// Mock Claude API — NEVER call real API in tests
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"score": 75, "reason": "Good match", "gaps": []}' }]
      })
    }
  }
}));

// Mock Neon DB
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}));
```

## Unit Tests to Write

### tests/unit/ai-match.test.ts
```typescript
import { describe, it, expect } from 'vitest';
import { scoreJobMatch } from '@/lib/ai/match';

describe('scoreJobMatch', () => {
  it('returns score between 0 and 100', async () => {
    const result = await scoreJobMatch(
      'Software engineer with React and TypeScript experience',
      'Looking for React developer with 2 years experience',
      'Frontend Engineer'
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.reason).toBeTruthy();
  });

  it('returns gaps array', async () => {
    const result = await scoreJobMatch('resume text', 'job description', 'job title');
    expect(Array.isArray(result.gaps)).toBe(true);
  });
});
```

### tests/unit/email-extractor.test.ts
```typescript
import { describe, it, expect } from 'vitest';
import { extractEmail, requiresEmailApply } from '@/lib/scraper/email-extractor';

describe('extractEmail', () => {
  it('extracts email from job description', () => {
    const text = 'Please send your resume to careers@company.com for consideration';
    expect(extractEmail(text)).toBe('careers@company.com');
  });

  it('returns null when no email present', () => {
    expect(extractEmail('Apply on our website')).toBeNull();
  });

  it('filters out noreply emails', () => {
    expect(extractEmail('Contact noreply@company.com')).toBeNull();
  });
});

describe('requiresEmailApply', () => {
  it('detects email-apply requirement', () => {
    expect(requiresEmailApply('Please email your resume to hr@company.com')).toBe(true);
  });

  it('returns false for standard apply links', () => {
    expect(requiresEmailApply('Click the apply button to submit your application')).toBe(false);
  });
});
```

### tests/unit/date-utils.test.ts
```typescript
import { describe, it, expect } from 'vitest';
import { getJobAgeLabel } from '@/lib/scraper/date-utils';

describe('getJobAgeLabel', () => {
  it('shows Today for same-day jobs', () => {
    const { label, isStale } = getJobAgeLabel(new Date());
    expect(label).toBe('Today');
    expect(isStale).toBe(false);
  });

  it('shows warning for 30+ day old jobs', () => {
    const old = new Date();
    old.setDate(old.getDate() - 35);
    const { isStale, warning } = getJobAgeLabel(old);
    expect(isStale).toBe(true);
    expect(warning).toBeTruthy();
  });
});
```

## E2E Tests (Playwright)

### tests/e2e/job-search.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test('user can search for jobs', async ({ page }) => {
  await page.goto('/dashboard/jobs');
  await page.fill('[data-testid="search-input"]', 'software engineer');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible();
});

test('H1B filter shows only H1B jobs', async ({ page }) => {
  await page.goto('/dashboard/jobs');
  await page.click('[data-testid="h1b-filter"]');
  const badges = page.locator('[data-testid="h1b-badge"]');
  await expect(badges.first()).toBeVisible();
});
```

### tests/e2e/resume-upload.spec.ts
```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test('user can upload resume and see parsed skills', async ({ page }) => {
  await page.goto('/dashboard/resume');
  const fileInput = page.locator('[data-testid="resume-upload"]');
  await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-resume.pdf'));
  await expect(page.locator('[data-testid="skills-list"]')).toBeVisible({ timeout: 10000 });
});
```

## package.json Scripts to Add
```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:all": "vitest && playwright test"
  }
}
```

## Rules
- NEVER call real Claude API or Neon DB in unit tests — always mock
- ALWAYS add `data-testid` attribute to interactive elements for E2E
- Run `npm run test` before every git commit
- If a test fails — FIX IT before moving to next feature
- Keep test files next to what they test OR in /tests folder

