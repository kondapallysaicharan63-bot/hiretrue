# Skill: Database (Neon + Drizzle ORM)
> Read MASTER-SKILL.md first.

## What This Skill Covers
Setting up and using the Neon PostgreSQL database with Drizzle ORM in Next.js.

## Setup Commands
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## File: lib/db/index.ts — Database Connection
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/drizzle/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## File: drizzle/schema.ts — Complete Schema
```typescript
import { pgTable, text, timestamp, boolean, integer, json, uuid } from 'drizzle-orm/pg-core';

// USERS
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  resume_text: text('resume_text'),          // extracted plain text from PDF
  resume_url: text('resume_url'),            // file storage URL
  visa_status: text('visa_status'),          // 'f1', 'h1b', 'citizen', 'gc', 'other'
  opt_end_date: timestamp('opt_end_date'),   // for F-1 students
  skills: json('skills').$type<string[]>(), // extracted skills array
  target_roles: json('target_roles').$type<string[]>(),
  target_locations: json('target_locations').$type<string[]>(),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// JOBS
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  external_id: text('external_id').unique(),     // ID from Adzuna or scraper
  source: text('source').notNull(),              // 'adzuna', 'linkedin', 'indeed', 'company'
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  description: text('description'),
  apply_url: text('apply_url'),
  apply_email: text('apply_email'),              // for email-only applications
  salary_min: integer('salary_min'),
  salary_max: integer('salary_max'),
  is_h1b_sponsor: boolean('is_h1b_sponsor').default(false),
  is_remote: boolean('is_remote').default(false),
  is_internship: boolean('is_internship').default(false),
  original_posted_at: timestamp('original_posted_at'), // REAL date from source - NEVER overwrite
  scraped_at: timestamp('scraped_at').defaultNow(),    // when WE scraped it
  is_deleted: boolean('is_deleted').default(false),
  raw_data: json('raw_data'),                    // full API response for debugging
});

// APPLICATIONS
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  job_id: uuid('job_id').notNull().references(() => jobs.id),
  status: text('status').notNull().default('saved'),
  // status options: 'saved' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  match_score: integer('match_score'),           // 0-100, from Claude
  match_reason: text('match_reason'),            // Claude explanation
  tailored_resume: text('tailored_resume'),      // Claude-generated resume for this job
  cover_letter: text('cover_letter'),            // Claude-generated cover letter
  notes: text('notes'),
  applied_at: timestamp('applied_at'),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// H1B SPONSORS (from DOL public dataset)
export const h1b_sponsors = pgTable('h1b_sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  company_name: text('company_name').notNull(),
  normalized_name: text('normalized_name').notNull(), // lowercase, no punctuation
  total_petitions: integer('total_petitions'),
  approved: integer('approved'),
  year: integer('year'),
});
```

## File: drizzle.config.ts — Migration Config
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Commands to Run After Schema Changes
```bash
# Generate migration files
npx drizzle-kit generate:pg

# Apply migrations to Neon
npx drizzle-kit push:pg
```

## Common Query Patterns
```typescript
import { db } from '@/lib/db';
import { jobs, applications } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// Get all H1B jobs
const h1bJobs = await db.select().from(jobs)
  .where(and(eq(jobs.is_h1b_sponsor, true), eq(jobs.is_deleted, false)))
  .orderBy(desc(jobs.original_posted_at));

// Get user applications with job details
const userApps = await db.select().from(applications)
  .leftJoin(jobs, eq(applications.job_id, jobs.id))
  .where(eq(applications.user_id, userId));
```

## Rules
- NEVER use raw SQL strings
- ALWAYS check for null/undefined before DB writes
- ALWAYS use `.where(eq(table.is_deleted, false))` in selects
- job `original_posted_at` = source date only, NEVER current date

