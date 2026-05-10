# HireTrue — Complete Build Instructions (Steps 3–10)
# Paste this entire file into Claude Code and say: "Execute all steps in order"

You are the senior developer for HireTrue. Steps 1 and 2 are already done.
Execute Steps 3 through 10 in order. After EACH step:
1. Run all tests
2. Git commit with a clear message
3. Git push to origin main
4. Tell the user what was built and what to test in browser

NEVER skip a step. NEVER move to next step if tests fail — fix first.
Always read the relevant skills/SKILL.md before building each step.

---

## STEP 3: Resume Upload + Parser

Read skills/resume-parser/SKILL.md first.

### Install
```
npm install pdf-parse
npm install -D @types/pdf-parse
```

### Build these files:

**src/lib/resume/parser.ts**
- `extractTextFromPDF(buffer: Buffer): Promise<string>` using pdf-parse
- `extractSkillsFromText(resumeText: string, claude: any): Promise<string[]>` using Claude API
- Handle errors: if PDF fails return clear error message
- If Claude fails return empty array

**src/lib/ai/client.ts**
- Anthropic client singleton
- Export: claude, MODEL = 'claude-haiku-4-5', MAX_TOKENS = 1500

**src/app/api/resume/upload/route.ts**
- POST endpoint
- Accept multipart form data with 'resume' field
- Validate: PDF only, max 5MB
- Extract text with pdf-parse
- Extract skills with Claude
- Save resume_text + skills to users table in Neon (match by session email)
- Return: { success: true, skills: string[], resumeText: string }
- Handle all errors with proper error messages

**src/app/(dashboard)/resume/page.tsx** (or update existing)
- File upload button with data-testid="resume-upload"
- Show loading spinner while uploading
- Show extracted skills as green badges after upload
- Show error message if upload fails
- Show success message when done

### Tests to write:
- __tests__/resume-parser.spec.ts
  - extractTextFromPDF returns string (mock pdf-parse)
  - extractSkillsFromText returns array (mock Claude)
  - handles PDF parse failure gracefully
  - handles Claude failure gracefully (returns empty array)

### After Step 3:
```
git add .
git commit -m "step 3 - resume upload + PDF parser + skill extraction"
git push origin main
```

Tell user: "Upload your resume PDF at localhost:3000/resume — you should see your skills listed"

---

## STEP 4: Job Search (Adzuna API)

Read skills/job-scraper/SKILL.md first.

### Build these files:

**src/lib/scraper/adzuna.ts**
```typescript
// Types
interface AdzunaJob {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  description: string
  redirect_url: string
  salary_min?: number
  salary_max?: number
  created: string  // ORIGINAL date — NEVER replace with new Date()
  contract_type?: string
}

// Functions
fetchJobs(params: { keywords: string, location?: string, page?: number }): Promise<AdzunaJob[]>
formatJob(job: AdzunaJob): object  // converts to our DB format, uses job.created for original_posted_at
```

**src/lib/scraper/date-utils.ts**
```typescript
getJobAgeLabel(originalPostedAt: Date): { label: string, isStale: boolean, warning: string | null }
// Rules:
// 0 days = "Today", no warning
// 1 day = "Yesterday", no warning  
// 2-14 days = "X days ago", no warning
// 15-30 days = "X days ago", isStale=true, warning="⚠️ Over 2 weeks old — many positions may be filled"
// 30+ days = isStale=true, warning="🚨 Old listing (30+ days) — verify it's still open before applying"
```

**src/lib/scraper/email-extractor.ts**
```typescript
extractEmail(text: string): string | null  // regex email extraction, filters noreply/donotreply
requiresEmailApply(description: string): boolean  // detects "email your resume to", "send cv to" etc
```

**src/lib/scraper/h1b-checker.ts**
```typescript
normalizeCompanyName(name: string): string  // lowercase, remove punctuation, remove Inc/LLC/Corp
isH1BSponsor(companyName: string): Promise<boolean>  // checks h1b_sponsors table in Neon
```

**src/app/api/jobs/search/route.ts**
- GET endpoint with query params: q, location, h1b (boolean), internship (boolean), remote (boolean)
- Call Adzuna API with ADZUNA_APP_ID and ADZUNA_API_KEY from env
- For each job: extract email from description, check H1B status
- Return formatted jobs with real dates
- Handle Adzuna API errors gracefully

**src/app/(dashboard)/jobs/page.tsx**
- Search input (data-testid="search-input")
- Search button (data-testid="search-button")  
- Filter toggles: H1B (data-testid="h1b-filter"), Remote, Internship
- Job cards showing:
  - Title, company, location
  - Salary range if available
  - REAL date with staleness warning
  - H1B badge if sponsor
  - Email apply indicator if email found
  - Loading skeleton while fetching (never blank screen)
  - Error state if API fails

**src/components/jobs/JobCard.tsx**
- Reusable job card component
- Props: title, company, location, matchScore?, isH1bSponsor, isRemote, originalPostedAt, applyEmail?, onSave, onTailorResume
- data-testid="job-card" on root element
- data-testid="h1b-badge" on H1B badge
- data-testid="save-job-btn" on save button
- data-testid="tailor-resume-btn" on tailor button

### Tests to write:
- __tests__/email-extractor.spec.ts
  - extractEmail finds email in text
  - extractEmail returns null when no email
  - extractEmail filters noreply emails
  - requiresEmailApply detects email-apply text
  - requiresEmailApply returns false for normal apply

- __tests__/date-utils.spec.ts
  - Today returns "Today", isStale=false
  - 5 days ago returns "5 days ago", isStale=false
  - 20 days ago returns isStale=true with warning
  - 35 days ago returns isStale=true with 30+ warning

### After Step 4:
```
git add .
git commit -m "step 4 - job search with Adzuna API + real dates + email extraction"
git push origin main
```

Tell user: "Search 'biomedical engineer' at localhost:3000/jobs — you should see real jobs with real dates"

---

## STEP 5: AI Match Scoring

Read skills/ai-matching/SKILL.md first.

### Build these files:

**src/lib/ai/match.ts**
```typescript
scoreJobMatch(
  resumeText: string,
  jobDescription: string, 
  jobTitle: string
): Promise<{ score: number, reason: string, gaps: string[] }>
```
- Use claude-haiku-4-5
- Prompt must ask for honest scoring (70+ only if genuinely 70%+ match)
- Return JSON with score 0-100, 2-sentence reason, gaps array
- Always try/catch — return { score: 0, reason: 'Could not evaluate', gaps: [] } on failure

**src/app/api/ai/match/route.ts**
- POST with { jobId, userId } OR derive userId from session
- Get user resume from Neon users table
- Get job description from Adzuna API (by jobId)
- Call scoreJobMatch
- Save match_score + match_reason to applications table
- Return { score, reason, gaps }

Update JobCard component to:
- Show match score bar when score is available
- Show score percentage
- Show "Why you match" on hover/click
- Show gaps as red badges

### Tests:
- __tests__/ai-match.spec.ts
  - Returns score between 0-100 (mock Claude)
  - Returns reason string
  - Returns gaps array
  - Handles Claude failure gracefully

### After Step 5:
```
git add .
git commit -m "step 5 - AI job match scoring with Claude"
git push origin main
```

Tell user: "Upload resume then search jobs — each job should show a match percentage"

---

## STEP 6: AI Resume Tailoring

Read skills/ai-matching/SKILL.md first.

### Build these files:

**src/lib/ai/resume.ts**
```typescript
tailorResume(
  originalResume: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string>
```
CRITICAL PROMPT RULES:
- "Write naturally, like a human — NOT keyword-stuffed"
- "Only highlight skills that genuinely match"
- "Do NOT invent experience not in the original resume"
- "Use strong action verbs"
- Return only the tailored resume text

**src/lib/ai/cover-letter.ts**
```typescript
generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string>
```
- 3 short paragraphs max
- Sound like a real person
- NO "I am writing to express my interest" opener
- Specific to this company

**src/app/api/ai/tailor/route.ts**
- POST with { jobId, company, title, description }
- Get user resume from session/Neon
- Call tailorResume + generateCoverLetter in parallel (Promise.all)
- Save both to applications table
- Return { tailoredResume, coverLetter }

Update job detail panel / modal:
- "Tailor Resume" button (data-testid="tailor-resume-btn")
- Show loading spinner while Claude generates
- Show side-by-side: Original resume vs Tailored resume
- Show cover letter below
- "Copy to clipboard" button for both
- "Download as PDF" button for tailored resume

### Tests:
- __tests__/ai-resume.spec.ts
  - tailorResume returns non-empty string (mock Claude)
  - tailorResume handles Claude failure (returns original)
  - generateCoverLetter returns non-empty string
  - generateCoverLetter handles failure

### After Step 6:
```
git add .
git commit -m "step 6 - AI resume tailoring + cover letter with Claude"
git push origin main
```

Tell user: "Click 'Tailor Resume' on any job — you should see a rewritten resume in ~5 seconds"

---

## STEP 7: H1B Filter + Seed Data

### Build these files:

**src/lib/scraper/h1b-seed.ts**
Seed the h1b_sponsors table with top 500 H1B sponsoring companies.
Use this hardcoded list of known H1B sponsors (major tech + healthcare companies):
Amazon, Google, Microsoft, Apple, Meta, Netflix, Uber, Lyft, Airbnb, Salesforce,
Oracle, IBM, Intel, Qualcomm, Nvidia, Adobe, VMware, Cisco, Dell, HP,
Deloitte, Accenture, Cognizant, Infosys, Tata Consultancy, Wipro, HCL,
Johnson & Johnson, Pfizer, Merck, Abbott, Medtronic, Boston Scientific,
JPMorgan Chase, Goldman Sachs, Morgan Stanley, Bank of America, Citigroup,
and 460 more major corporations across tech, healthcare, finance, consulting.

Create function: seedH1BSponsors() that inserts all into h1b_sponsors table
- normalizedName = company name lowercase, no punctuation, no Inc/LLC/Corp
- Only insert if not already exists (upsert)

**src/app/api/admin/seed-h1b/route.ts**
- GET endpoint to trigger seeding
- Only callable once (check if table already has data)

Update isH1BSponsor() in h1b-checker.ts to actually query the seeded table.

**src/app/(dashboard)/profile/page.tsx**
- Visa status selector (F-1, H1B, Green Card, Citizen, Other)
- OPT end date picker (show only if F-1 selected)
- OPT timeline warning: "Your OPT expires in X days — apply to H1B sponsors first"
- Target roles input
- Target locations input
- Save button → updates users table

### After Step 7:
```
git add .
git commit -m "step 7 - H1B filter + sponsor database + profile page"
git push origin main
```

Tell user: "Go to localhost:3000/profile, set visa status to F-1. Then toggle H1B filter in job search."

---

## STEP 8: Application Tracker

### Build these files:

**src/app/(dashboard)/tracker/page.tsx**
Kanban board with 5 columns:
- Saved | Applied | Interview | Offer | Rejected

Each column:
- Shows count of applications
- Lists job cards with: title, company, match score, date applied

Each card:
- Click to expand: show tailored resume, cover letter, notes
- data-testid="application-card"

**src/app/api/applications/route.ts**
- GET: fetch all applications for logged-in user (join with jobs table)
- POST: create new application (save job)
- PATCH: update status (drag between columns)

Update "Save Job" button on job cards to:
- Call POST /api/applications
- Show success toast
- Job appears in Saved column

Add drag-and-drop between columns:
- Use @dnd-kit/core (install it)
- Drag card from Saved → Applied updates status in DB

### After Step 8:
```
git add .
git commit -m "step 8 - application tracker kanban board"
git push origin main
```

Tell user: "Save a job from search → check localhost:3000/tracker → it should appear in Saved column"

---

## STEP 9: Interview Prep

### Build these files:

**src/lib/ai/interview-prep.ts**
```typescript
generateInterviewPrep(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<{ questions: string[], tips: string[] }>
```
- 8 likely interview questions specific to this role
- 4 preparation tips specific to this company
- Return JSON only

**src/app/api/ai/interview-prep/route.ts**
- POST with { jobId, title, company, description }
- Get user resume from session
- Call generateInterviewPrep
- Return { questions, tips }

Add to job detail panel:
- "Interview Prep" button (data-testid="interview-prep-btn")
- Show 8 questions as numbered list
- Show 4 tips as bullet points
- Show loading state while generating

### Tests:
- __tests__/interview-prep.spec.ts
  - Returns questions array with 8 items (mock Claude)
  - Returns tips array with 4 items
  - Handles Claude failure gracefully

### After Step 9:
```
git add .
git commit -m "step 9 - interview prep with Claude AI"
git push origin main
```

Tell user: "Click 'Interview Prep' on any job — you should see 8 specific questions in ~5 seconds"

---

## STEP 10: Full Test Suite + Final Cleanup

### Run complete test suite:
```
npx vitest run
```

Fix ANY failing test before continuing.

### Then run E2E setup:
```
npm install -D @playwright/test
npx playwright install chromium
```

### Write E2E tests in e2e/ folder:

**e2e/job-search.spec.ts**
- User visits /jobs
- Types "software engineer" in search
- Sees job cards appear
- Sees real dates on cards
- Clicks H1B filter — sees only H1B jobs

**e2e/resume-upload.spec.ts**  
- User visits /resume
- Uploads a PDF
- Sees skills extracted

**e2e/tracker.spec.ts**
- User saves a job
- Visits /tracker
- Sees job in Saved column

### Final cleanup:
1. Remove all JobSync branding — replace with HireTrue everywhere
2. Update page title in layout.tsx to "HireTrue — Job Search for Students"
3. Update favicon
4. Check all pages work: /jobs, /resume, /tracker, /profile
5. Check mobile layout (375px width)
6. Remove any console.log statements left in production code

### Final commit:
```
git add .
git commit -m "step 10 - full test suite + E2E tests + final cleanup — HireTrue v1.0 ready for testing"
git push origin main
```

### Tell user:
"HireTrue is complete. Test it:
1. Go to localhost:3000
2. Sign up with your email + select F-1 visa status
3. Upload your resume at /resume
4. Search 'biomedical engineer internship' at /jobs
5. Toggle H1B filter
6. Click 'Tailor Resume' on a job you like
7. Save the job → check /tracker
8. Click 'Interview Prep'

If all 8 steps work → we're ready for SJSU beta testing."

---

## GIT RULES (follow for every step)
```
git add .
git commit -m "step X - description"
git push origin main
```

Never push broken code. Run tests first. If tests fail, fix before pushing.

## ENVIRONMENT VARIABLES NEEDED
All should already be in .env.local:
- DATABASE_URL (Neon)
- ANTHROPIC_API_KEY
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- ADZUNA_APP_ID
- ADZUNA_API_KEY

If any are missing, stop and tell the user which one is needed.
