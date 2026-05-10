import { pgTable, text, timestamp, boolean, integer, json, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password_hash: text('password_hash'),
  resume_text: text('resume_text'),
  resume_url: text('resume_url'),
  visa_status: text('visa_status'), // 'f1' | 'h1b' | 'citizen' | 'gc' | 'other'
  opt_end_date: timestamp('opt_end_date'),
  skills: json('skills').$type<string[]>(),
  target_roles: json('target_roles').$type<string[]>(),
  target_locations: json('target_locations').$type<string[]>(),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  external_id: text('external_id').unique(),
  source: text('source').notNull(), // 'adzuna' | 'linkedin' | 'indeed' | 'company'
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  description: text('description'),
  apply_url: text('apply_url'),
  apply_email: text('apply_email'),
  salary_min: integer('salary_min'),
  salary_max: integer('salary_max'),
  is_h1b_sponsor: boolean('is_h1b_sponsor').default(false),
  is_remote: boolean('is_remote').default(false),
  is_internship: boolean('is_internship').default(false),
  // NEVER overwrite this with current timestamp — always use the source date
  original_posted_at: timestamp('original_posted_at'),
  scraped_at: timestamp('scraped_at').defaultNow(),
  is_deleted: boolean('is_deleted').default(false),
  raw_data: json('raw_data'),
});

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  job_id: uuid('job_id').notNull().references(() => jobs.id),
  status: text('status').notNull().default('saved'),
  // status: 'saved' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  match_score: integer('match_score'), // 0-100, from Claude
  match_reason: text('match_reason'),
  tailored_resume: text('tailored_resume'),
  cover_letter: text('cover_letter'),
  notes: text('notes'),
  applied_at: timestamp('applied_at'),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const h1b_sponsors = pgTable('h1b_sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  company_name: text('company_name').notNull(),
  normalized_name: text('normalized_name').notNull(), // lowercase, no punctuation
  total_petitions: integer('total_petitions'),
  approved: integer('approved'),
  year: integer('year'),
});
