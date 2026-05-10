import { NextRequest, NextResponse } from 'next/server';
import { fetchJobs, formatJob } from '@/lib/scraper/adzuna';
import { isH1BSponsor } from '@/lib/scraper/h1b-checker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get('q') ?? '';
  const location = searchParams.get('location') ?? '';
  const h1bOnly = searchParams.get('h1b') === 'true';
  const internshipOnly = searchParams.get('internship') === 'true';
  const remoteOnly = searchParams.get('remote') === 'true';

  if (!keywords) {
    return NextResponse.json({ error: 'Search query required' }, { status: 400 });
  }

  try {
    const rawJobs = await fetchJobs({ keywords, location });
    let formatted = rawJobs.map(formatJob);

    if (internshipOnly) formatted = formatted.filter((j) => j.is_internship);
    if (remoteOnly) formatted = formatted.filter((j) => j.is_remote);

    if (h1bOnly) {
      const withH1B = await Promise.all(
        formatted.map(async (job) => ({
          ...job,
          is_h1b_sponsor: await isH1BSponsor(job.company),
        }))
      );
      formatted = withH1B.filter((j) => j.is_h1b_sponsor);
    }

    return NextResponse.json({ jobs: formatted, total: formatted.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Job search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
