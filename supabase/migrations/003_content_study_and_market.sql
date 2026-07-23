-- MĪZĀN publishing, study-centre and market-reference upgrade.
-- Run after 001_mizan_platform.sql and 002_working_backend.sql.
-- This migration is idempotent and safe to run again.

create extension if not exists pgcrypto;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  active boolean not null default true
);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins
    where platform_admins.user_id = auth.uid()
      and platform_admins.active = true
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create table if not exists public.reading_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null,
  body_markdown text not null,
  category text not null default 'Zakat & Society',
  language text not null default 'English' check (language in ('English','Malayalam','Arabic')),
  cover_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  author_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  content_markdown text not null,
  module text not null default 'Zakat Foundations',
  level text not null default 'Foundation' check (level in ('Foundation','Intermediate','Advanced')),
  lesson_order integer not null default 1 check (lesson_order > 0),
  language text not null default 'English' check (language in ('English','Malayalam','Arabic')),
  image_url text,
  chart_data jsonb not null default '{"type":"bars","title":"","items":[]}'::jsonb,
  reference_title text not null,
  reference_locator text not null,
  reference_excerpt text,
  source_status text not null default 'reference_only' check (source_status in ('reference_only','excerpt_verified','translation_verified')),
  reviewer_note text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  author_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  resource_type text not null check (resource_type in ('reading_post','study_material')),
  resource_id uuid not null,
  action text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reading_posts_public_idx
  on public.reading_posts(status, language, published_at desc);
create index if not exists study_materials_public_idx
  on public.study_materials(status, language, module, lesson_order);
create index if not exists content_audit_resource_idx
  on public.content_audit_events(resource_type, resource_id, created_at desc);

drop trigger if exists reading_posts_set_updated_at on public.reading_posts;
create trigger reading_posts_set_updated_at
before update on public.reading_posts
for each row execute function public.set_updated_at();

drop trigger if exists study_materials_set_updated_at on public.study_materials;
create trigger study_materials_set_updated_at
before update on public.study_materials
for each row execute function public.set_updated_at();

create or replace function public.audit_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_type text;
  target_id uuid;
  target_status text;
begin
  target_type := case tg_table_name
    when 'reading_posts' then 'reading_post'
    else 'study_material'
  end;
  target_id := coalesce(new.id, old.id);
  target_status := coalesce(new.status, old.status);

  insert into public.content_audit_events(actor_id, resource_type, resource_id, action, event_data)
  values (
    auth.uid(),
    target_type,
    target_id,
    lower(tg_op),
    jsonb_build_object('status', target_status)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists reading_posts_audit on public.reading_posts;
create trigger reading_posts_audit
after insert or update or delete on public.reading_posts
for each row execute function public.audit_content_change();

drop trigger if exists study_materials_audit on public.study_materials;
create trigger study_materials_audit
after insert or update or delete on public.study_materials
for each row execute function public.audit_content_change();

alter table public.platform_admins enable row level security;
alter table public.reading_posts enable row level security;
alter table public.study_materials enable row level security;
alter table public.content_audit_events enable row level security;

drop policy if exists "admins read own admin grant" on public.platform_admins;
create policy "admins read own admin grant"
on public.platform_admins for select
using (user_id = auth.uid() and active = true);

drop policy if exists "published reading is public" on public.reading_posts;
create policy "published reading is public"
on public.reading_posts for select
using (status = 'published' or public.is_super_admin());

drop policy if exists "admins create reading" on public.reading_posts;
create policy "admins create reading"
on public.reading_posts for insert
with check (public.is_super_admin() and author_id = auth.uid());

drop policy if exists "admins update reading" on public.reading_posts;
create policy "admins update reading"
on public.reading_posts for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "admins delete reading" on public.reading_posts;
create policy "admins delete reading"
on public.reading_posts for delete
using (public.is_super_admin());

drop policy if exists "published study is public" on public.study_materials;
create policy "published study is public"
on public.study_materials for select
using (status = 'published' or public.is_super_admin());

drop policy if exists "admins create study" on public.study_materials;
create policy "admins create study"
on public.study_materials for insert
with check (public.is_super_admin() and author_id = auth.uid());

drop policy if exists "admins update study" on public.study_materials;
create policy "admins update study"
on public.study_materials for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "admins delete study" on public.study_materials;
create policy "admins delete study"
on public.study_materials for delete
using (public.is_super_admin());

drop policy if exists "admins read content audit" on public.content_audit_events;
create policy "admins read content audit"
on public.content_audit_events for select
using (public.is_super_admin());

-- Bootstrap the first Super Admin from the Supabase SQL editor only:
-- insert into public.platform_admins(user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do update set active = true;
--
-- Never expose a service-role key in the website or browser.
