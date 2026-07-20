-- MĪZĀN production workflow upgrade.
-- Run after 001_mizan_platform.sql in the Supabase SQL editor.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists notification_settings jsonb not null default '{"appointments":true,"reviews":true,"reminders":true,"security":true}'::jsonb;
alter table public.cases add column if not exists currency text not null default 'INR';
alter table public.qazis add column if not exists country text;
alter table public.qazis add column if not exists public_contact text;
alter table public.appointments add column if not exists case_id uuid references public.cases(id) on delete set null;
alter table public.appointments add column if not exists consultation_mode text not null default 'online';
alter table public.appointments add column if not exists preferred_time time;
alter table public.appointments add column if not exists share_consent boolean not null default false;
alter table public.masala_questions add column if not exists subject text not null default 'General';
alter table public.masala_questions add column if not exists language text not null default 'English';
alter table public.masala_questions add column if not exists context_data jsonb not null default '{}'::jsonb;

create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  keywords text[] not null default '{}',
  madhhab_scope text[] not null default '{hanafi,maliki,shafii,hanbali}',
  summary text not null,
  follow_up_questions text[] not null default '{}',
  source_label text not null,
  source_reference text not null,
  confidence_label text not null default 'Context required',
  requires_review boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.masala_questions add column if not exists matched_article_id uuid references public.knowledge_articles(id) on delete set null;

create index if not exists case_events_case_created_idx on public.case_events(case_id, created_at desc);
create index if not exists appointments_case_idx on public.appointments(case_id);
create index if not exists knowledge_articles_published_category_idx on public.knowledge_articles(published, category);
create index if not exists masala_questions_user_created_idx on public.masala_questions(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at before update on public.cases for each row execute function public.set_updated_at();
drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
drop trigger if exists knowledge_articles_set_updated_at on public.knowledge_articles;
create trigger knowledge_articles_set_updated_at before update on public.knowledge_articles for each row execute function public.set_updated_at();

create or replace function public.protect_case_review_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() = old.user_id then
    if old.verification_status in ('approved', 'disputed') then
      raise exception 'A finalised case cannot be changed by its owner';
    end if;
    if new.user_id <> old.user_id then
      raise exception 'Case ownership cannot be changed';
    end if;
    if new.verification_status not in ('unverified', 'review_requested') then
      raise exception 'Only an authorised review workflow can set this status';
    end if;
    new.reviewer_note := old.reviewer_note;
  end if;
  return new;
end;
$$;

drop trigger if exists cases_protect_review_fields on public.cases;
create trigger cases_protect_review_fields before update on public.cases for each row execute function public.protect_case_review_fields();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.case_events enable row level security;
alter table public.knowledge_articles enable row level security;

drop policy if exists "own case events read" on public.case_events;
create policy "own case events read" on public.case_events for select using (
  exists (select 1 from public.cases where cases.id = case_events.case_id and cases.user_id = auth.uid())
);
drop policy if exists "own case events create" on public.case_events;
create policy "own case events create" on public.case_events for insert with check (
  actor_id = auth.uid() and exists (select 1 from public.cases where cases.id = case_events.case_id and cases.user_id = auth.uid())
);
drop policy if exists "published knowledge read" on public.knowledge_articles;
create policy "published knowledge read" on public.knowledge_articles for select using (published = true);
drop policy if exists "own cases update" on public.cases;
create policy "own cases update" on public.cases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own appointments create" on public.appointments;
create policy "own appointments create" on public.appointments for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.qazis where qazis.id = appointments.qazi_id and qazis.verification_status = 'verified')
  and (
    (case_id is null and share_consent = false)
    or
    (case_id is not null and share_consent = true and exists (select 1 from public.cases where cases.id = appointments.case_id and cases.user_id = auth.uid()))
  )
);
drop policy if exists "own appointments update" on public.appointments;
create policy "own appointments update" on public.appointments for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and status in ('requested', 'cancelled')
  and (
    (case_id is null and share_consent = false)
    or
    (case_id is not null and share_consent = true and exists (select 1 from public.cases where cases.id = appointments.case_id and cases.user_id = auth.uid()))
  )
);
drop policy if exists "own questions create" on public.masala_questions;
create policy "own questions create" on public.masala_questions for insert with check (
  auth.uid() = user_id
  and answer_data is null
  and (
    (matched_article_id is null and status = 'submitted')
    or
    (matched_article_id is not null and status = 'answered' and exists (
      select 1 from public.knowledge_articles
      where knowledge_articles.id = masala_questions.matched_article_id and knowledge_articles.published = true
    ))
  )
);
drop policy if exists "own questions update" on public.masala_questions;
drop policy if exists "own questions delete" on public.masala_questions;
create policy "own questions delete" on public.masala_questions for delete using (auth.uid() = user_id);
drop policy if exists "own appointments delete" on public.appointments;
create policy "own appointments delete" on public.appointments for delete using (auth.uid() = user_id);

insert into public.knowledge_articles
  (slug, title, category, keywords, summary, follow_up_questions, source_label, source_reference, confidence_label, requires_review, published)
values
  (
    'digital-wallet-zakat',
    'Zakat on accessible digital-wallet balances',
    'Modern Zakat',
    array['digital wallet','wallet','upi','paypal','cash balance','zakat'],
    'An accessible balance that is fully owned is ordinarily reviewed with other cash holdings for niṣāb and ḥawl. Restricted, disputed or third-party balances should be separated until ownership and access are clear.',
    array['Is the balance fully owned and withdrawable?','Has a lunar year passed over the combined qualifying wealth?','Are any amounts disputed, restricted or held for another person?'],
    'Zakat principles for monetary wealth',
    'Qur’an 9:103; apply the selected madhhab’s rules on ownership, niṣāb and ḥawl with qualified verification.',
    'Context required',
    true,
    true
  ),
  (
    'bank-nominee-inheritance',
    'A bank nominee is not automatically the final Islamic heir',
    'Modern Farā’iḍ',
    array['bank nominee','nominee','inheritance','heir','bank account'],
    'A nomination in account paperwork may identify who receives or administers funds under local procedure, but it does not by itself establish the final Islamic shares. Ownership, debts, the full family tree and local documents must be reviewed together.',
    array['Who legally owned the funds at death?','Which relatives were alive at the time of death?','Does the nominee document transfer ownership or only permit receipt?'],
    'Foundational Farā’iḍ rules',
    'Qur’an 4:11–12; local documents and ownership questions require a qualified scholar and appropriate legal advice.',
    'Qualified review required',
    true,
    true
  ),
  (
    'online-business-zakat',
    'Zakat review for an online trading business',
    'Business & Finance',
    array['online business','inventory','amazon','flipkart','ecommerce','receivables','business zakat'],
    'A preliminary business-zakat review normally maps sale inventory, business cash and recoverable receivables, then separately examines eligible short-term obligations. Fixed assets and doubtful debts should not be treated automatically.',
    array['Are the goods held for sale or long-term use?','Which receivables are realistically recoverable?','Which liabilities are immediately due?'],
    'Classical trade-goods principles',
    'Apply the selected madhhab’s treatment of trade goods, receivables and liabilities; verify the final classification with a qualified scholar.',
    'Category review required',
    true,
    true
  ),
  (
    'ai-islamic-learning',
    'Using AI as a support tool for Islamic learning',
    'Technology & Society',
    array['ai','artificial intelligence','learning','education','islamic study'],
    'AI can help organise material, search a controlled knowledge collection and formulate study questions. It should not be treated as an independent mufti, and important quotations, rulings and personal conclusions should be checked against reliable sources and qualified teachers.',
    array['Is the tool using a controlled source collection?','Can the cited material be checked?','Does the question depend on personal facts or local law?'],
    'Educational verification principle',
    'Use verified sources and qualified teachers for rulings; AI output remains preliminary and may contain errors.',
    'Educational guidance',
    true,
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  keywords = excluded.keywords,
  summary = excluded.summary,
  follow_up_questions = excluded.follow_up_questions,
  source_label = excluded.source_label,
  source_reference = excluded.source_reference,
  confidence_label = excluded.confidence_label,
  requires_review = excluded.requires_review,
  published = excluded.published,
  updated_at = now();

-- Do not expose a Supabase service-role key in the browser or Netlify client variables.
