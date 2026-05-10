import { getJobAgeLabel } from '@/lib/scraper/date-utils';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe('getJobAgeLabel', () => {
  it('returns "Today" for same-day post', () => {
    const result = getJobAgeLabel(new Date());
    expect(result.label).toBe('Today');
    expect(result.isStale).toBe(false);
    expect(result.warning).toBeNull();
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const result = getJobAgeLabel(daysAgo(1));
    expect(result.label).toBe('Yesterday');
    expect(result.isStale).toBe(false);
  });

  it('returns "5 days ago" for 5 days, not stale', () => {
    const result = getJobAgeLabel(daysAgo(5));
    expect(result.label).toBe('5 days ago');
    expect(result.isStale).toBe(false);
    expect(result.warning).toBeNull();
  });

  it('returns stale with warning for 20 days ago', () => {
    const result = getJobAgeLabel(daysAgo(20));
    expect(result.label).toBe('20 days ago');
    expect(result.isStale).toBe(true);
    expect(result.warning).toContain('2 weeks old');
  });

  it('returns stale with 30+ warning for 35 days ago', () => {
    const result = getJobAgeLabel(daysAgo(35));
    expect(result.isStale).toBe(true);
    expect(result.warning).toContain('30+');
  });

  it('14-day post is not stale', () => {
    const result = getJobAgeLabel(daysAgo(14));
    expect(result.isStale).toBe(false);
  });

  it('15-day post is stale', () => {
    const result = getJobAgeLabel(daysAgo(15));
    expect(result.isStale).toBe(true);
  });
});
