# HireTrue — Master Skill File
> Read this FIRST before reading any other skill file.
> This is the single source of truth for the entire project.

## What We Are Building
HireTrue is a job search platform built for F-1/H1B students and international job seekers.
It beats Jobright by: showing real job dates, generating human-quality tailored resumes via Claude AI,
providing a real H1B company filter, and having zero billing dark patterns.

## The Challenge
- Build in 30 days
- Test on Sai Charan first (summer internship goal)
- Then 5–10 SJSU students
- Then public launch with free + paid model
- Every feature must work before moving to the next

## Tech Stack — NEVER deviate from this
```
Frontend:       Next.js 14 (App Router) + TypeScript
UI Components:  Shadcn UI + Tailwind CSS
Database:       Neon (PostgreSQL) — serverless
ORM:            Drizzle ORM
Auth:           NextAuth.js v5
AI:             Anthropic Claude API (claude-haiku-4-5 for speed/cost)
Job Source:     Adzuna API (free 50K calls/mo) + custom scraper
Email:          Resend (free 3K/mo)
Hosting:        Vercel (free tier)
Testing:        Vitest (unit) + Playwright (E2E)
Package Mgr:    npm
```

## Folder Structure — ALWAYS follow this
```
hiretrue/
├── app/
│   ├── (auth)/          # login, register pages
│   ├── (dashboard)/     # main app after login
│   │   ├── jobs/        # job search + feed
│   │   ├── resume/      # resume upload + tailoring
│   │   ├── tracker/     # application tracker
│   │   └── profile/     # user profile + visa status
│   └── api/             # all API routes
│       ├── jobs/
│       ├── resume/
│       ├── ai/
│       └── scraper/
├── components/          # reusable UI components
├── lib/
│   ├── db/              # Neon + Drizzle setup
│   ├── ai/              # Claude API calls
│   ├── scraper/         # job scraping logic
│   └── utils/           # helper functions
├── drizzle/             # DB schema + migrations
└── skills/              # all SKILL.md files (this folder)
```

## Environment Variables — Required before ANYTHING runs
```env
DATABASE_URL=             # Neon PostgreSQL connection string
ANTHROPIC_API_KEY=        # Claude API key
NEXTAUTH_SECRET=          # random 32-char string
NEXTAUTH_URL=             # http://localhost:3000 (dev) or https://hiretrue.vercel.app (prod)
ADZUNA_APP_ID=            # from developer.adzuna.com
ADZUNA_API_KEY=           # from developer.adzuna.com
RESEND_API_KEY=           # from resend.com
```

## Rules Every Developer (and Claude) Must Follow

### Code Rules
1. ALWAYS use TypeScript — no `any` types
2. ALWAYS handle errors — never let a failed API call crash the app
3. ALWAYS show loading states — never leave user staring at blank screen
4. ALWAYS validate inputs — never trust user input directly to DB
5. NEVER store API keys in code — always use .env.local
6. NEVER commit .env.local to GitHub

### AI (Claude) Rules
1. Use `claude-haiku-4-5` for all AI calls (cheapest, fast enough)
2. ALWAYS set max_tokens = 1500 for resume tailoring
3. ALWAYS include the job description + user resume in the prompt
4. NEVER keyword-stuff resumes — prompt must say "write like a human"
5. ALWAYS show the user what Claude changed and why

### Database Rules
1. ALWAYS use Drizzle ORM — never raw SQL strings
2. ALWAYS use transactions for multi-step writes
3. NEVER delete data — use `is_deleted` boolean flag instead
4. job posting dates MUST come from the source — never overwrite with current timestamp

### Scraper Rules
1. ALWAYS show the ORIGINAL job posting date from source
2. Mark jobs older than 30 days with a "⚠️ Old listing" warning
3. NEVER re-index timestamps (this is Jobright's #1 flaw)
4. Respect robots.txt — use Adzuna API for compliant job data
5. Rate limit scraper: max 1 request per 2 seconds

### Testing Rules
1. Every API route needs at least 1 unit test
2. Every user-facing feature needs 1 E2E test
3. Run tests before every commit: `npm run test`
4. AI output must be tested with mock responses (never call real API in tests)

## Priority Order — Build in this exact sequence
1. Database schema (Neon + Drizzle)
2. Auth (NextAuth)
3. Resume upload + PDF parsing
4. Job search (Adzuna API)
5. AI match scoring (Claude)
6. AI resume tailoring (Claude)
7. H1B filter
8. Email extraction for "email to apply" jobs
9. Application tracker
10. Interview prep (Claude)
11. Payments (Stripe) — LAST, after everything else works

## Definition of "Done" for Each Feature
A feature is DONE only when:
- [ ] It works in the browser without errors
- [ ] It has at least 1 passing test
- [ ] It handles the error case (what if API fails?)
- [ ] Sai Charan has personally used it and confirmed it works
