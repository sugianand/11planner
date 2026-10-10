-- 11Planner database schema for Supabase.
-- Run once in a new Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Rebuilt from the columns the frontend and backend read and write.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  firstname text,
  lastname text,
  worktime text,
  workdays text[],
  workstyle text,
  assignmentplan text,
  daily_study_limit numeric,
  additional_info text,
  theme_preference text,
  color_theme_preference text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------- user_settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_mode text,
  color_theme text,
  notifications_enabled boolean default true,
  reminder_lead_hours numeric default 24,
  sound_enabled boolean default true,
  email_updates_enabled boolean default false,
  weekly_report_enabled boolean default false,
  last_weekly_report_week text,
  privacy_include_personal_info boolean default true,
  privacy_analytics_enabled boolean default false,
  privacy_personalization_enabled boolean default true,
  privacy_insights_history_enabled boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_name text,
  course_code text,
  name text,
  code text,
  professor text,
  description text,
  course_days text[],
  start_time text,
  end_time text,
  is_online boolean default false,
  has_lab boolean default false,
  lab_day text,
  lab_start_time text,
  lab_end_time text,
  lab_is_online boolean default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  course_id uuid references public.courses (id) on delete set null,
  deadline timestamptz,
  description text,
  priority integer default 2,
  estimated_hours numeric default 1,
  status text default 'pending',
  points numeric,
  url text,
  source text default 'manual',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------- tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_title text,
  course_id uuid references public.courses (id) on delete set null,
  deadline_at timestamptz,
  estimated_hours numeric,
  priority_level integer,
  description text,
  task_type text default 'assignment',
  status text default 'todo',
  title text,
  deadline timestamptz,
  priority integer default 2,
  completed boolean default false,
  assignment_id uuid references public.assignments (id) on delete set null,
  source text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------- schedule_blocks
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  block_type text default 'study',
  title text,
  source_task_id uuid references public.tasks (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  generation_id uuid,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists courses_user_idx on public.courses (user_id);
create index if not exists assignments_user_idx on public.assignments (user_id);
create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists schedule_blocks_user_start_idx on public.schedule_blocks (user_id, starts_at);

-- ------------------------------------------------------ row level security
-- The browser uses the public anon key, so each user may only touch their own rows.
-- The backend uses the service role key, which bypasses these policies.
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.schedule_blocks enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own courses" on public.courses;
create policy "own courses" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own assignments" on public.assignments;
create policy "own assignments" on public.assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own schedule blocks" on public.schedule_blocks;
create policy "own schedule blocks" on public.schedule_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
