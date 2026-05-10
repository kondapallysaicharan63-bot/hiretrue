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
  if (diffDays <= 14) return { label: `${diffDays} days ago`, isStale: false, warning: null };
  if (diffDays <= 30) return {
    label: `${diffDays} days ago`,
    isStale: true,
    warning: '⚠️ Over 2 weeks old — many positions may be filled',
  };
  return {
    label: `${diffDays} days ago`,
    isStale: true,
    warning: '🚨 Old listing (30+ days) — verify it\'s still open before applying',
  };
}
