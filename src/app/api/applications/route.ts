import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/neondb';
import { users, applications, jobs } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      match_score: applications.match_score,
      match_reason: applications.match_reason,
      tailored_resume: applications.tailored_resume,
      cover_letter: applications.cover_letter,
      notes: applications.notes,
      applied_at: applications.applied_at,
      created_at: applications.created_at,
      job_id: jobs.id,
      job_external_id: jobs.external_id,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      description: jobs.description,
      apply_url: jobs.apply_url,
      apply_email: jobs.apply_email,
      salary_min: jobs.salary_min,
      salary_max: jobs.salary_max,
      is_h1b_sponsor: jobs.is_h1b_sponsor,
      is_remote: jobs.is_remote,
      is_internship: jobs.is_internship,
      original_posted_at: jobs.original_posted_at,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.job_id, jobs.id))
    .where(and(eq(applications.user_id, session.user.id), eq(applications.is_deleted, false)));

  return NextResponse.json({ applications: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { job } = await req.json();
    if (!job) return NextResponse.json({ error: 'job required' }, { status: 400 });

    // Upsert the job record
    const [existingJob] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.external_id, job.id))
      .limit(1);

    let jobId = existingJob?.id;

    if (!jobId) {
      const [newJob] = await db
        .insert(jobs)
        .values({
          external_id: job.id,
          source: job.source ?? 'adzuna',
          title: job.title,
          company: job.company,
          location: job.location ?? '',
          description: job.description ?? '',
          apply_url: job.apply_url ?? null,
          apply_email: job.apply_email ?? null,
          salary_min: job.salary_min ?? null,
          salary_max: job.salary_max ?? null,
          is_h1b_sponsor: job.is_h1b_sponsor ?? false,
          is_remote: job.is_remote ?? false,
          is_internship: job.is_internship ?? false,
          original_posted_at: job.original_posted_at ? new Date(job.original_posted_at) : null,
        })
        .returning({ id: jobs.id });
      jobId = newJob.id;
    }

    // Check if application already exists
    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.user_id, session.user.id), eq(applications.job_id, jobId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ id: existing.id, alreadySaved: true });
    }

    const [app] = await db
      .insert(applications)
      .values({ user_id: session.user.id, job_id: jobId, status: 'saved' })
      .returning({ id: applications.id });

    return NextResponse.json({ id: app.id, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { id, status, notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'applied') updateData.applied_at = new Date();

    await db
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, id), eq(applications.user_id, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db
      .update(applications)
      .set({ is_deleted: true, updated_at: new Date() })
      .where(and(eq(applications.id, id), eq(applications.user_id, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
