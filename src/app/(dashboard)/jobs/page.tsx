'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobCard, type JobCardProps } from '@/components/jobs/JobCard';
import { Loader2, Search, AlertCircle } from 'lucide-react';

type JobResult = Omit<JobCardProps, 'onSave' | 'onTailorResume' | 'onInterviewPrep' | 'isSaved'> & {
  external_id: string;
  source: string;
};

export default function JobsPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [h1b, setH1b] = useState(false);
  const [internship, setInternship] = useState(false);
  const [remote, setRemote] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [tailorJobId, setTailorJobId] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<{ tailoredResume: string; coverLetter: string } | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [prepJobId, setPrepJobId] = useState<string | null>(null);
  const [prepResult, setPrepResult] = useState<{ questions: string[]; tips: string[] } | null>(null);
  const [prepping, setPrepping] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: query });
      if (location) params.set('location', location);
      if (h1b) params.set('h1b', 'true');
      if (internship) params.set('internship', 'true');
      if (remote) params.set('remote', 'true');

      const res = await fetch(`/api/jobs/search?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Search failed'); setJobs([]); return; }
      setJobs(data.jobs ?? []);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      if (res.ok) setSavedIds((prev) => new Set(prev).add(id));
    } catch { /* silent */ }
  }

  async function handleTailor(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    setTailorJobId(id);
    setTailoring(true);
    setTailorResult(null);
    try {
      const res = await fetch('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, company: job.company, title: job.title, description: job.description }),
      });
      const data = await res.json();
      if (res.ok) setTailorResult(data);
    } catch { /* silent */ }
    setTailoring(false);
  }

  async function handleInterviewPrep(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    setPrepJobId(id);
    setPrepping(true);
    setPrepResult(null);
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, title: job.title, company: job.company, description: job.description }),
      });
      const data = await res.json();
      if (res.ok) setPrepResult(data);
    } catch { /* silent */ }
    setPrepping(false);
  }

  const activeJob = tailorJobId ? jobs.find((j) => j.id === tailorJobId) : prepJobId ? jobs.find((j) => j.id === prepJobId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Search</h1>

      {/* Search bar */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Job title, keywords…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 min-w-48"
          data-testid="search-input"
        />
        <Input
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-44"
        />
        <Button onClick={handleSearch} disabled={loading} data-testid="search-button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1">Search</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FilterToggle label="H1B Sponsors" active={h1b} testId="h1b-filter" onChange={setH1b} />
        <FilterToggle label="Remote" active={remote} testId="remote-filter" onChange={setRemote} />
        <FilterToggle label="Internship" active={internship} testId="internship-filter" onChange={setInternship} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && jobs.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">No jobs found. Try different keywords.</p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              {...job}
              isSaved={savedIds.has(job.id)}
              onSave={handleSave}
              onTailorResume={handleTailor}
              onInterviewPrep={handleInterviewPrep}
            />
          ))}
        </div>
      )}

      {/* Tailor Resume Panel */}
      {tailorJobId && activeJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-bold text-lg">Tailor Resume for {activeJob.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setTailorJobId(null)}>✕</Button>
            </div>
            {tailoring && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating with Claude…</div>}
            {tailorResult && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="font-semibold text-sm">Tailored Resume</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(tailorResult.tailoredResume)}>Copy</Button>
                  </div>
                  <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{tailorResult.tailoredResume}</pre>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="font-semibold text-sm">Cover Letter</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(tailorResult.coverLetter)}>Copy</Button>
                  </div>
                  <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">{tailorResult.coverLetter}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Prep Panel */}
      {prepJobId && activeJob && !tailorJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-bold text-lg">Interview Prep: {activeJob.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setPrepJobId(null)}>✕</Button>
            </div>
            {prepping && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating questions…</div>}
            {prepResult && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2">Likely Interview Questions</h3>
                  <ol className="space-y-2">
                    {prepResult.questions.map((q, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="font-bold text-primary shrink-0">{i + 1}.</span>{q}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">Preparation Tips</h3>
                  <ul className="space-y-1">
                    {prepResult.tips.map((t, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterToggle({
  label, active, testId, onChange,
}: {
  label: string; active: boolean; testId: string; onChange: (v: boolean) => void;
}) {
  return (
    <button
      data-testid={testId}
      onClick={() => onChange(!active)}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary'}`}
    >
      {label}
    </button>
  );
}
