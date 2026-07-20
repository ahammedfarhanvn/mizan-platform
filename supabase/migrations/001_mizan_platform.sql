create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  madhhab text check (madhhab in ('hanafi','maliki','shafii','hanbali')),
  preferred_language text not null default 'English',
  region text,
  account_role text not null default 'Individual',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_type text not null check (case_type in ('zakat','faraid')),
  madhhab text not null check (madhhab in ('hanafi','maliki','shafii','hanbali')),
  title text not null,
  input_data jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','review_requested','approved','changes_requested','disputed')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qazis (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  city text,
  state text,
  languages text[] not null default '{}',
  madhhab_specialisations text[] not null default '{}',
  expertise text[] not null default '{}',
  consultation_modes text[] not null default '{}',
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qazi_id uuid references public.qazis(id) on delete set null,
  qazi_reference text,
  consultation_type text not null,
  preferred_date date,
  notes text,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.masala_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  madhhab text not null,
  question text not null,
  answer_data jsonb,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create index if not exists cases_user_created_idx on public.cases(user_id,created_at desc);
create index if not exists appointments_user_created_idx on public.appointments(user_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.qazis enable row level security;
alter table public.appointments enable row level security;
alter table public.masala_questions enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid()=id);
drop policy if exists "own profile create" on public.profiles;
create policy "own profile create" on public.profiles for insert with check (auth.uid()=id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists "own cases read" on public.cases;
create policy "own cases read" on public.cases for select using (auth.uid()=user_id);
drop policy if exists "own cases create" on public.cases;
create policy "own cases create" on public.cases for insert with check (auth.uid()=user_id);
drop policy if exists "own cases update" on public.cases;
create policy "own cases update" on public.cases for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own cases delete" on public.cases;
create policy "own cases delete" on public.cases for delete using (auth.uid()=user_id);
drop policy if exists "verified qazi directory" on public.qazis;
create policy "verified qazi directory" on public.qazis for select using (verification_status='verified');
drop policy if exists "own appointments read" on public.appointments;
create policy "own appointments read" on public.appointments for select using (auth.uid()=user_id);
drop policy if exists "own appointments create" on public.appointments;
create policy "own appointments create" on public.appointments for insert with check (auth.uid()=user_id);
drop policy if exists "own appointments update" on public.appointments;
create policy "own appointments update" on public.appointments for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own questions read" on public.masala_questions;
create policy "own questions read" on public.masala_questions for select using (auth.uid()=user_id);
drop policy if exists "own questions create" on public.masala_questions;
create policy "own questions create" on public.masala_questions for insert with check (auth.uid()=user_id);

-- Use only the public publishable key in the website. Keep the service-role key server-side.
