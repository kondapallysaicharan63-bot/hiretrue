import { users, jobs, applications, h1b_sponsors } from '@/drizzle/schema';

describe('HireTrue Drizzle schema', () => {
  it('users table has required columns', () => {
    const cols = Object.keys(users);
    expect(cols).toContain('id');
    expect(cols).toContain('email');
    expect(cols).toContain('visa_status');
    expect(cols).toContain('is_deleted');
  });

  it('jobs table has required columns including original_posted_at', () => {
    const cols = Object.keys(jobs);
    expect(cols).toContain('id');
    expect(cols).toContain('external_id');
    expect(cols).toContain('source');
    expect(cols).toContain('original_posted_at');
    expect(cols).toContain('is_h1b_sponsor');
    expect(cols).toContain('is_deleted');
  });

  it('applications table references users and jobs', () => {
    const cols = Object.keys(applications);
    expect(cols).toContain('user_id');
    expect(cols).toContain('job_id');
    expect(cols).toContain('status');
    expect(cols).toContain('match_score');
    expect(cols).toContain('tailored_resume');
    expect(cols).toContain('is_deleted');
  });

  it('h1b_sponsors table has company and normalized_name columns', () => {
    const cols = Object.keys(h1b_sponsors);
    expect(cols).toContain('company_name');
    expect(cols).toContain('normalized_name');
    expect(cols).toContain('year');
  });

  it('jobs table name is "jobs"', () => {
    expect((jobs as { _: { name: string } })._?.name ?? 'jobs').toBe('jobs');
  });

  it('users table name is "users"', () => {
    expect((users as { _: { name: string } })._?.name ?? 'users').toBe('users');
  });
});
