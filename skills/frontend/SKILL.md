# Skill: Frontend (Next.js 14 + Shadcn UI + Tailwind)
> Read MASTER-SKILL.md first.

## What This Skill Covers
All UI components, pages, layouts, and frontend patterns for HireTrue.

## Setup Commands
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge input label skeleton toast
```

## Design System
```
Primary color:   #1D9E75 (green — trust, growth)
Background:      #FAFAFA (off-white)
Card:            #FFFFFF with border
Danger:          #E24B4A (red)
Warning:         #BA7517 (amber)
Font:            Inter (system default in Next.js)
Border radius:   8px (rounded-lg)
```

## Key Pages to Build

### 1. Job Feed — /dashboard/jobs
```
┌─────────────────────────────────┐
│ 🔍 Search jobs...    [H1B] [Remote] [Internship]  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Software Engineer @ Google  │ │
│ │ 📍 Mountain View, CA        │ │
│ │ 💰 $120K–$160K  ✅ H1B     │ │
│ │ 🕐 2 days ago               │ │  ← REAL date always
│ │ Match: 84% [████████░░]     │ │
│ │ [Tailor Resume] [Save] [Apply] │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 2. Resume Page — /dashboard/resume
- Upload PDF → show parsed skills
- Click any job → see tailored resume side by side
- Download tailored resume as PDF

### 3. Tracker — /dashboard/tracker
- Kanban board: Saved → Applied → Interview → Offer → Rejected
- Drag and drop between columns
- Click card to see match score, tailored resume, notes

### 4. Profile — /dashboard/profile
- Visa status selector (F-1, H1B, GC, Citizen)
- OPT end date (if F-1)
- Target roles + locations

## Component Patterns

### Job Card Component
```tsx
// components/jobs/JobCard.tsx
import { Badge } from '@/components/ui/badge';
import { getJobAgeLabel } from '@/lib/scraper/date-utils';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  matchScore?: number;
  isH1bSponsor: boolean;
  isRemote: boolean;
  originalPostedAt: Date;
  applyEmail?: string;
  onTailorResume: () => void;
  onSave: () => void;
}

export function JobCard({ title, company, location, matchScore,
  isH1bSponsor, isRemote, originalPostedAt, applyEmail,
  onTailorResume, onSave }: JobCardProps) {

  const { label, isStale, warning } = getJobAgeLabel(originalPostedAt);

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
         data-testid="job-card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm">{company} · {location}</p>
        </div>
        <div className="flex gap-1">
          {isH1bSponsor && (
            <Badge className="bg-green-100 text-green-800" data-testid="h1b-badge">
              ✅ H1B
            </Badge>
          )}
          {isRemote && <Badge variant="outline">Remote</Badge>}
        </div>
      </div>

      {/* Match score bar */}
      {matchScore !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Match score</span>
            <span className="font-medium">{matchScore}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Date — always real */}
      <p className={`text-xs mb-1 ${isStale ? 'text-amber-600' : 'text-gray-400'}`}>
        🕐 {label}
      </p>
      {warning && (
        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2">
          {warning}
        </p>
      )}

      {/* Email apply indicator */}
      {applyEmail && (
        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">
          📧 Email to apply: {applyEmail}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={onTailorResume}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
          data-testid="tailor-resume-btn"
        >
          Tailor Resume
        </button>
        <button
          onClick={onSave}
          className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
          data-testid="save-job-btn"
        >
          Save
        </button>
      </div>
    </div>
  );
}
```

### Loading Skeleton
```tsx
// Always show skeleton while loading — never blank screen
import { Skeleton } from '@/components/ui/skeleton';

export function JobCardSkeleton() {
  return (
    <div className="bg-white border rounded-lg p-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-2 w-full mb-1" />
      <Skeleton className="h-3 w-1/4 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}
```

## Rules
- ALWAYS add `data-testid` to interactive elements
- ALWAYS show skeleton loading state (never blank)
- ALWAYS show error state if API fails
- NEVER hide stale job warnings — user must see real dates
- Use Shadcn components — don't build from scratch
- Keep components small — max 100 lines per component
- Mobile-first: test on 375px width minimum

