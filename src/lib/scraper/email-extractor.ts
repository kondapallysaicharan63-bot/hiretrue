export function extractEmail(text: string): string | null {
  if (!text) return null;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  if (!matches) return null;

  const excluded = ['noreply', 'no-reply', 'donotreply', 'example', 'test'];
  const valid = matches.filter(
    (email) => !excluded.some((ex) => email.toLowerCase().includes(ex))
  );

  return valid[0] ?? null;
}

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
  return signals.some((s) => lower.includes(s));
}
