import { extractEmail } from './email-extractor';

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
  created: string; // ORIGINAL posting date — NEVER replace with new Date()
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
  url.searchParams.set('results_per_page', String(params.resultsPerPage ?? 20));
  if (params.location) url.searchParams.set('where', params.location);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);

  const data = await res.json();
  return data.results ?? [];
}

function isInternship(title: string): boolean {
  return /intern(ship)?/i.test(title);
}

function isRemote(location: string): boolean {
  return /remote|work from home|wfh/i.test(location);
}

export function formatJob(job: AdzunaJob) {
  return {
    external_id: `adzuna_${job.id}`,
    source: 'adzuna' as const,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description,
    apply_url: job.redirect_url,
    apply_email: extractEmail(job.description),
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    is_internship: isInternship(job.title),
    is_remote: isRemote(job.location.display_name),
    is_h1b_sponsor: false,
    // ALWAYS use the real source date — NEVER new Date()
    original_posted_at: new Date(job.created),
  };
}
