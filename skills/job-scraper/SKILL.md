# Skill: Job Scraper (Adzuna API + Email Extraction)
> Read MASTER-SKILL.md first.

## What This Skill Covers
Fetching real jobs from Adzuna API, extracting email-only job posts,
and always preserving original posting dates.

## Adzuna API Setup
1. Register free at: https://developer.adzuna.com
2. Get App ID + API Key
3. Free tier: 50,000 calls/month

## File: lib/scraper/adzuna.ts
```typescript
const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs/us/search';

export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string; // ORIGINAL posting date from Adzuna
  contract_type?: string;
}

export async function fetchJobs(params: {
  keywords: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
}): Promise<AdzunaJob[]> {
  const url = new URL(`${ADZUNA_BASE}/1`);
  url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!);
  url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!);
  url.searchParams.set('what', params.keywords);
  url.searchParams.set('results_per_page', String(params.resultsPerPage || 20));
  if (params.location) url.searchParams.set('where', params.location);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);

  const data = await res.json();
  return data.results || [];
}

// Convert Adzuna job to our DB format
export function formatJob(job: AdzunaJob) {
  return {
    external_id: `adzuna_${job.id}`,
    source: 'adzuna',
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description,
    apply_url: job.redirect_url,
    apply_email: extractEmail(job.description), // check for email-only posts
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    is_internship: isInternship(job.title),
    is_remote: isRemote(job.location.display_name),
    original_posted_at: new Date(job.created), // ALWAYS use Adzuna's date
    // NEVER use new Date() here - that's Jobright's mistake
  };
}
```

## File: lib/scraper/email-extractor.ts — Email Extraction
```typescript
// Extracts email addresses from job descriptions
// Used for "email to apply" job posts
export function extractEmail(text: string): string | null {
  if (!text) return null;

  // Match standard email patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  if (!matches) return null;

  // Filter out generic/noreply emails
  const excluded = ['noreply', 'no-reply', 'donotreply', 'example', 'test'];
  const valid = matches.filter(email =>
    !excluded.some(ex => email.toLowerCase().includes(ex))
  );

  return valid[0] || null;
}

// Detect if job requires email application
export function requiresEmailApply(description: string): boolean {
  const signals = [
    'email your resume',
    'send resume to',
    'email cv to',
    'send your application to',
    'apply by email',
    'submit resume to',
    'email us at',
    'careers@',
    'hr@',
    'jobs@',
    'recruiting@',
  ];
  const lower = description.toLowerCase();
  return signals.some(signal => lower.includes(signal));
}
```

## File: lib/scraper/h1b-checker.ts — H1B Detection
```typescript
// H1B sponsor detection from company name matching
// Uses public DOL dataset loaded into our DB

import { db } from '@/lib/db';
import { h1b_sponsors } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation
    .replace(/\b(inc|llc|ltd|corp|co|company)\b/g, '') // remove suffixes
    .trim();
}

export async function isH1BSponsor(companyName: string): Promise<boolean> {
  const normalized = normalizeCompanyName(companyName);
  const result = await db.select()
    .from(h1b_sponsors)
    .where(eq(h1b_sponsors.normalized_name, normalized))
    .limit(1);
  return result.length > 0;
}
```

## File: lib/scraper/date-utils.ts — Date Display Rules
```typescript
// CRITICAL: Always show honest dates to users
// This is where Jobright fails — they show their scrape date, not the real posting date

export function getJobAgeLabel(originalPostedAt: Date): {
  label: string;
  isStale: boolean;
  warning: string | null;
} {
  const now = new Date();
  const diffMs = now.getTime() - originalPostedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: 'Today', isStale: false, warning: null };
  if (diffDays === 1) return { label: 'Yesterday', isStale: false, warning: null };
  if (diffDays <= 7) return { label: `${diffDays} days ago`, isStale: false, warning: null };
  if (diffDays <= 14) return { label: `${diffDays} days ago`, isStale: false, warning: null };
  if (diffDays <= 30) return {
    label: `${diffDays} days ago`,
    isStale: true,
    warning: '⚠️ This job is over 2 weeks old — many positions may be filled'
  };
  return {
    label: `${diffDays} days ago`,
    isStale: true,
    warning: '🚨 Old listing (30+ days) — verify it is still open before applying'
  };
}
```

## API Route: app/api/jobs/search/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchJobs, formatJob } from '@/lib/scraper/adzuna';
import { isH1BSponsor } from '@/lib/scraper/h1b-checker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';
  const h1bOnly = searchParams.get('h1b') === 'true';
  const internshipOnly = searchParams.get('internship') === 'true';

  try {
    const rawJobs = await fetchJobs({ keywords, location });
    const formatted = rawJobs.map(formatJob);

    // Apply filters
    let filtered = formatted;
    if (internshipOnly) filtered = filtered.filter(j => j.is_internship);

    // Check H1B status for each company
    if (h1bOnly) {
      const withH1B = await Promise.all(
        filtered.map(async (job) => ({
          ...job,
          is_h1b_sponsor: await isH1BSponsor(job.company)
        }))
      );
      filtered = withH1B.filter(j => j.is_h1b_sponsor);
    }

    return NextResponse.json({ jobs: filtered, total: filtered.length });
  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 });
  }
}
```

## Rules
- ALWAYS use `original_posted_at` from Adzuna — NEVER `new Date()`
- ALWAYS show staleness warnings for 14+ day old jobs
- ALWAYS extract emails from description
- Rate limit: add `await sleep(2000)` between batch scrape calls
- Log every scrape with timestamp and count for debugging

