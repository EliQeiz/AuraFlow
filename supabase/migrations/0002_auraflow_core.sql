-- AuraFlow core: Supabase Auth, Postgres data model, RLS, and private Storage.
-- This runs after the retired media-processing baseline. Legacy tables are
-- retained under explicit names so this migration does not discard any data.

do $$
begin
  if to_regclass('public.projects') is not null and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'project_name'
  ) then
    alter table public.projects rename to legacy_media_projects;
  end if;

  if to_regclass('public.profiles') is not null and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'username'
  ) then
    alter table public.profiles rename to legacy_media_profiles;
  end if;
end;
$$;

create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null default 'AuraFlow Client' check (char_length(full_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 512),
  plan text not null default 'Starter' check (plan in ('Starter', 'Growth', 'Enterprise')),
  saved_templates text[] not null default '{}',
  project_count integer not null default 0 check (project_count >= 0),
  notifications boolean not null default true,
  theme text check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_path)
  values (
    new.id,
    coalesce(new.email, concat(new.id::text, '@invalid.local')),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, 'AuraFlow Client'), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'avatar_path', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email citext not null,
  phone text,
  service text not null,
  budget text not null,
  message text not null check (char_length(message) between 20 and 6000),
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  email citext primary key,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 120),
  client_email citext not null,
  title text not null check (char_length(title) between 2 and 180),
  project_type text not null check (char_length(project_type) <= 120),
  description text not null check (char_length(description) between 20 and 6000),
  audience text not null check (char_length(audience) between 1 and 500),
  budget numeric(12, 2) not null check (budget >= 0 and budget <= 100000000),
  timeline text not null check (char_length(timeline) <= 120),
  reference_links jsonb not null default '[]'::jsonb,
  template_slug text check (template_slug is null or char_length(template_slug) <= 180),
  solution_slug text check (solution_slug is null or char_length(solution_slug) <= 180),
  platform_mode text check (platform_mode in ('managed-hosted', 'custom-build', 'prototype-only')),
  subdomain_preference text check (subdomain_preference is null or char_length(subdomain_preference) <= 120),
  tenant_slug text unique check (tenant_slug is null or tenant_slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  staging_url text check (staging_url is null or staging_url ~ '^https://'),
  production_url text check (production_url is null or production_url ~ '^https://'),
  prototype_spec jsonb,
  design jsonb,
  design_draft_id uuid,
  status text not null default 'Submitted' check (status in ('Submitted', 'Discovery', 'Designing', 'Building', 'Review', 'Completed', 'On Hold')),
  admin_summary text check (admin_summary is null or char_length(admin_summary) <= 6000),
  last_client_note text check (last_client_note is null or char_length(last_client_note) <= 2000),
  deadline date,
  last_event_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_updated_idx on public.projects (user_id, updated_at desc);
create index projects_status_updated_idx on public.projects (status, updated_at desc);

create or replace function public.owns_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = target_project_id and user_id = auth.uid()
  );
$$;

create table public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('reference', 'content', 'preview')),
  name text not null check (char_length(name) between 1 and 240),
  storage_path text not null check (char_length(storage_path) <= 512),
  content_type text check (content_type is null or char_length(content_type) <= 160),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index project_assets_project_created_idx on public.project_assets (project_id, created_at desc);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  author_name text not null check (char_length(author_name) between 1 and 120),
  role text not null check (role in ('client', 'admin')),
  text text not null check (char_length(text) between 1 and 6000),
  kind text not null default 'text' check (kind in ('text', 'audio', 'file', 'call')),
  media_path text check (media_path is null or char_length(media_path) <= 512),
  media_type text check (media_type is null or char_length(media_type) <= 160),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 14400000),
  transcript text check (transcript is null or char_length(transcript) <= 12000),
  language text check (language is null or char_length(language) <= 32),
  created_at timestamptz not null default now()
);

create index project_messages_project_created_idx on public.project_messages (project_id, created_at asc);

create table public.project_work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('deliverable', 'review', 'change', 'task')),
  title text not null check (char_length(title) between 2 and 240),
  details text not null default '' check (char_length(details) <= 6000),
  due_date date,
  assigned_to text not null check (assigned_to in ('client', 'admin')),
  url text check (url is null or url ~ '^https://'),
  state text not null default 'open' check (state in ('open', 'in-progress', 'submitted', 'approved', 'returned', 'accepted', 'completed', 'cancelled')),
  response text not null default '' check (char_length(response) <= 6000),
  author_id uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  last_event_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_work_items_project_updated_idx on public.project_work_items (project_id, updated_at desc);

create table public.project_internal_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  text text not null check (char_length(text) between 1 and 6000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  entity_id uuid,
  kind text not null check (char_length(kind) between 1 and 80),
  title text not null check (char_length(title) between 1 and 240),
  state text check (state is null or char_length(state) <= 80),
  created_at timestamptz not null default now()
);

create index project_events_user_created_idx on public.project_events (user_id, created_at desc);
create index project_events_project_created_idx on public.project_events (project_id, created_at desc);

create table public.project_operations (
  project_id uuid primary key references public.projects(id) on delete cascade,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  checkpoint jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.user_event_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.project_events(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table public.user_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.support_conversations (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  author_name text not null check (char_length(author_name) between 1 and 120),
  role text not null check (role in ('client', 'admin')),
  text text not null check (char_length(text) between 1 and 6000),
  kind text not null default 'text' check (kind in ('text', 'audio', 'file', 'call')),
  media_path text check (media_path is null or char_length(media_path) <= 512),
  media_type text check (media_type is null or char_length(media_type) <= 160),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 14400000),
  transcript text check (transcript is null or char_length(transcript) <= 12000),
  language text check (language is null or char_length(language) <= 32),
  created_at timestamptz not null default now()
);

create index support_messages_conversation_created_idx on public.support_messages (conversation_id, created_at asc);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  kind text not null check (kind in ('voice', 'video')),
  status text not null default 'requested' check (status in ('requested', 'ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.call_participants (
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  primary key (call_id, user_id)
);

create table public.call_signals (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  signal jsonb not null,
  created_at timestamptz not null default now()
);

create index call_signals_call_created_idx on public.call_signals (call_id, created_at asc);

create table public.studio_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suite_slug text not null check (char_length(suite_slug) between 1 and 180),
  name text not null check (char_length(name) between 2 and 120),
  document jsonb not null default '{}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index studio_drafts_owner_updated_idx on public.studio_drafts (user_id, updated_at desc);

create table public.studio_draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.studio_drafts(id) on delete cascade,
  revision integer not null check (revision > 0),
  document jsonb not null,
  created_at timestamptz not null default now(),
  unique (draft_id, revision)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,179}$'),
  title text not null check (char_length(title) between 2 and 240),
  payload jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,179}$'),
  payload jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.afc_courses (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{2,179}$'),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,179}$'),
  title text not null check (char_length(title) between 4 and 140),
  summary text not null check (char_length(summary) between 20 and 2400),
  category text not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  price_ghs numeric(12, 2) not null default 0 check (price_ghs >= 0),
  instructor_name text not null,
  cover_image text,
  published boolean not null default false,
  estimated_hours integer not null default 1 check (estimated_hours between 1 and 1000),
  outcomes jsonb not null default '[]'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  assignments jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.afc_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.afc_courses(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'active', 'completed')),
  completed_lesson_ids jsonb not null default '[]'::jsonb,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.afc_enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.afc_courses(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 2000),
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'declined')),
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.afc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.afc_courses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 240),
  response text not null check (char_length(response) <= 12000),
  attachment_path text check (attachment_path is null or char_length(attachment_path) <= 512),
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'returned')),
  score numeric(5, 2) check (score is null or score between 0 and 100),
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 6000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.afc_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.afc_courses(id) on delete restrict,
  certificate_code text not null unique check (certificate_code ~ '^[A-Z0-9-]{8,80}$'),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.afc_assessments (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{3,180}$'),
  course_id text not null references public.afc_courses(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 180),
  duration_minutes integer not null check (duration_minutes between 1 and 240),
  pass_mark integer not null check (pass_mark between 0 and 100),
  max_attempts integer not null check (max_attempts between 1 and 5),
  question_count integer not null check (question_count between 1 and 40),
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Correct answers never have a client-readable policy. AFC command endpoints use
-- the server-side Supabase service role to read and score this table.
create table public.afc_assessment_keys (
  assessment_id text primary key references public.afc_assessments(id) on delete cascade,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table public.afc_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id text not null references public.afc_assessments(id) on delete cascade,
  course_id text not null references public.afc_courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number between 1 and 5),
  status text not null default 'in-progress' check (status in ('in-progress', 'submitted', 'expired')),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  answers jsonb not null default '{}'::jsonb,
  score integer check (score is null or score between 0 and 100),
  passed boolean,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, user_id, attempt_number)
);

create table public.afc_assessment_integrity_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.afc_assessment_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('visibility-hidden', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'network-reconnected')),
  created_at timestamptz not null default now()
);

create table public.afc_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('restaurant', 'school')),
  name text not null check (char_length(name) between 2 and 160),
  phone text not null check (char_length(phone) between 5 and 40),
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_updated_idx on public.businesses (owner_id, updated_at desc);

create table public.business_menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  price_ghs numeric(12, 2) not null check (price_ghs >= 0),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 40),
  items jsonb not null default '[]'::jsonb,
  total_ghs numeric(12, 2) not null check (total_ghs >= 0),
  fulfilment text not null check (fulfilment in ('pickup', 'delivery', 'dine-in')),
  status text not null default 'received' check (status in ('received', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_students (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  admission_number text not null check (char_length(admission_number) between 1 and 80),
  class_name text not null check (char_length(class_name) between 1 and 120),
  guardian_name text not null check (char_length(guardian_name) between 1 and 160),
  guardian_phone text not null check (char_length(guardian_phone) between 5 and 40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index business_students_admission_number_ci_idx
  on public.business_students (business_id, lower(admission_number));

create table public.business_attendance (
  business_id uuid not null references public.businesses(id) on delete cascade,
  attendance_date date not null,
  entries jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (business_id, attendance_date)
);

create table public.business_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  action text not null check (char_length(action) between 1 and 500),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.business_whatsapp_configs (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  phone_number_id text not null,
  access_token_ciphertext text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.api_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_minute bigint not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, subject_hash, window_minute)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Audit/update timestamps are generated by the database, never supplied by the browser.
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger user_roles_updated_at before update on public.user_roles for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger project_work_items_updated_at before update on public.project_work_items for each row execute procedure public.set_updated_at();
create trigger project_internal_notes_updated_at before update on public.project_internal_notes for each row execute procedure public.set_updated_at();
create trigger project_operations_updated_at before update on public.project_operations for each row execute procedure public.set_updated_at();
create trigger calls_updated_at before update on public.calls for each row execute procedure public.set_updated_at();
create trigger studio_drafts_updated_at before update on public.studio_drafts for each row execute procedure public.set_updated_at();
create trigger blog_posts_updated_at before update on public.blog_posts for each row execute procedure public.set_updated_at();
create trigger template_catalog_updated_at before update on public.template_catalog for each row execute procedure public.set_updated_at();
create trigger afc_courses_updated_at before update on public.afc_courses for each row execute procedure public.set_updated_at();
create trigger afc_enrollments_updated_at before update on public.afc_enrollments for each row execute procedure public.set_updated_at();
create trigger afc_enrollment_requests_updated_at before update on public.afc_enrollment_requests for each row execute procedure public.set_updated_at();
create trigger afc_submissions_updated_at before update on public.afc_submissions for each row execute procedure public.set_updated_at();
create trigger afc_assessments_updated_at before update on public.afc_assessments for each row execute procedure public.set_updated_at();
create trigger afc_assessment_attempts_updated_at before update on public.afc_assessment_attempts for each row execute procedure public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses for each row execute procedure public.set_updated_at();
create trigger business_menu_items_updated_at before update on public.business_menu_items for each row execute procedure public.set_updated_at();
create trigger business_orders_updated_at before update on public.business_orders for each row execute procedure public.set_updated_at();
create trigger business_students_updated_at before update on public.business_students for each row execute procedure public.set_updated_at();
create trigger business_whatsapp_configs_updated_at before update on public.business_whatsapp_configs for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.contacts enable row level security;
alter table public.quotes enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.projects enable row level security;
alter table public.project_assets enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_work_items enable row level security;
alter table public.project_internal_notes enable row level security;
alter table public.project_events enable row level security;
alter table public.project_operations enable row level security;
alter table public.user_event_reads enable row level security;
alter table public.user_snippets enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.calls enable row level security;
alter table public.call_participants enable row level security;
alter table public.call_signals enable row level security;
alter table public.studio_drafts enable row level security;
alter table public.studio_draft_versions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.template_catalog enable row level security;
alter table public.afc_courses enable row level security;
alter table public.afc_enrollments enable row level security;
alter table public.afc_enrollment_requests enable row level security;
alter table public.afc_submissions enable row level security;
alter table public.afc_certificates enable row level security;
alter table public.afc_assessments enable row level security;
alter table public.afc_assessment_keys enable row level security;
alter table public.afc_assessment_attempts enable row level security;
alter table public.afc_assessment_integrity_events enable row level security;
alter table public.afc_audit_log enable row level security;
alter table public.businesses enable row level security;
alter table public.business_menu_items enable row level security;
alter table public.business_orders enable row level security;
alter table public.business_students enable row level security;
alter table public.business_attendance enable row level security;
alter table public.business_events enable row level security;
alter table public.business_whatsapp_configs enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.audit_log enable row level security;

-- Profiles and roles. Roles are server-managed: clients can read their own role,
-- but cannot create or alter any role record.
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy roles_select_self on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Public lead capture has no read capability. These policies are intentionally
-- narrow and are normally exercised by server validation as well.
create policy contacts_insert on public.contacts for insert to authenticated with check (user_id = auth.uid());
create policy quotes_insert on public.quotes for insert to authenticated with check (user_id = auth.uid());
create policy newsletter_insert on public.newsletter_subscribers for insert to anon, authenticated with check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Client delivery workspace. Administrator writes are performed by server routes
-- with the service role; ordinary client updates never have access to status or
-- admin-only columns through column-level grants below.
create policy projects_select on public.projects for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy projects_insert on public.projects for insert to authenticated with check (user_id = auth.uid());
create policy projects_update_owner on public.projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy project_assets_select on public.project_assets for select to authenticated using (public.owns_project(project_id) or public.is_admin());
create policy project_assets_insert on public.project_assets for insert to authenticated with check (public.owns_project(project_id) and uploaded_by = auth.uid() and kind in ('reference', 'content'));
create policy project_messages_select on public.project_messages for select to authenticated using (public.owns_project(project_id) or public.is_admin());
create policy project_messages_insert_client on public.project_messages for insert to authenticated with check (public.owns_project(project_id) and author_id = auth.uid() and role = 'client');
create policy work_items_select on public.project_work_items for select to authenticated using (public.owns_project(project_id) or public.is_admin());
create policy work_items_insert_change on public.project_work_items for insert to authenticated with check (public.owns_project(project_id) and author_id = auth.uid() and updated_by = auth.uid() and kind = 'change' and assigned_to = 'admin' and state = 'open');
create policy project_events_select on public.project_events for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy project_operations_select on public.project_operations for select to authenticated using (public.owns_project(project_id) or public.is_admin());
create policy event_reads_select on public.user_event_reads for select to authenticated using (user_id = auth.uid());
create policy event_reads_insert on public.user_event_reads for insert to authenticated with check (user_id = auth.uid());
create policy event_reads_update on public.user_event_reads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy snippets_admin_only on public.user_snippets for all to authenticated using (user_id = auth.uid() and public.is_admin()) with check (user_id = auth.uid() and public.is_admin());
create policy internal_notes_admin_only on public.project_internal_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Support and calls remain private to a client, participants, and administrators.
create policy conversations_select on public.support_conversations for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy conversations_insert on public.support_conversations for insert to authenticated with check (id = auth.uid() and user_id = auth.uid());
create policy conversations_update on public.support_conversations for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy support_messages_select on public.support_messages for select to authenticated using (conversation_id = auth.uid() or public.is_admin());
create policy support_messages_insert_client on public.support_messages for insert to authenticated with check (conversation_id = auth.uid() and author_id = auth.uid() and role = 'client');
create policy calls_select on public.calls for select to authenticated using (client_id = auth.uid() or created_by = auth.uid() or public.is_admin());
create policy calls_insert on public.calls for insert to authenticated with check (client_id = auth.uid() or public.is_admin());
create policy call_participants_select on public.call_participants for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy call_signals_select on public.call_signals for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy call_signals_insert on public.call_signals for insert to authenticated with check (sender_id = auth.uid());

-- Studio documents are strictly owner-private; staff access is through a linked
-- project handoff rather than broad client draft access.
create policy studio_drafts_owner on public.studio_drafts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy studio_versions_owner on public.studio_draft_versions for select to authenticated using (exists (select 1 from public.studio_drafts where id = draft_id and user_id = auth.uid()));

create policy blog_public_read on public.blog_posts for select to anon, authenticated using (published = true or public.is_admin());
create policy blog_admin_write on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy templates_public_read on public.template_catalog for select to anon, authenticated using (published = true or public.is_admin());
create policy templates_admin_write on public.template_catalog for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- AFC. Learners can only see their own learning record. Answer keys, audit logs,
-- and assessment state transitions remain server-only.
create policy afc_courses_read on public.afc_courses for select to anon, authenticated using (published = true or public.is_admin());
create policy afc_courses_admin_write on public.afc_courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy afc_enrollments_read on public.afc_enrollments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy afc_requests_read on public.afc_enrollment_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy afc_requests_insert on public.afc_enrollment_requests for insert to authenticated with check (user_id = auth.uid() and status = 'submitted');
create policy afc_submissions_read on public.afc_submissions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy afc_submissions_insert on public.afc_submissions for insert to authenticated with check (user_id = auth.uid());
create policy afc_certificates_read on public.afc_certificates for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy afc_assessments_read on public.afc_assessments for select to authenticated using (published = true or public.is_admin());
create policy afc_attempts_read on public.afc_assessment_attempts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy afc_integrity_read on public.afc_assessment_integrity_events for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Tenant runtime data is served through authenticated API routes using the
-- service role. Browser users can read only their own tenant and orders.
create policy businesses_owner_read on public.businesses for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy business_menu_owner_read on public.business_menu_items for select to authenticated using (exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin())));
create policy business_orders_read on public.business_orders for select to authenticated using (customer_id = auth.uid() or exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin())));
create policy business_students_owner_read on public.business_students for select to authenticated using (exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin())));
create policy business_attendance_owner_read on public.business_attendance for select to authenticated using (exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin())));
create policy business_events_owner_read on public.business_events for select to authenticated using (exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin())));

-- No browser policy exists for secrets, rate limits, or audit trails.

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_path, notifications, theme, saved_templates) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert on public.contacts, public.quotes, public.newsletter_subscribers to anon, authenticated;
grant select, insert, update on public.projects to authenticated;
grant select, insert on public.project_assets, public.project_messages, public.project_work_items, public.project_events, public.project_operations to authenticated;
grant select, insert, update on public.user_event_reads to authenticated;
grant select, insert, update, delete on public.user_snippets to authenticated;
grant select, insert, update on public.support_conversations to authenticated;
grant select, insert on public.support_messages, public.calls, public.call_signals to authenticated;
grant select on public.call_participants to authenticated;
grant select, insert, update, delete on public.studio_drafts to authenticated;
grant select on public.studio_draft_versions to authenticated;
grant select on public.blog_posts, public.template_catalog, public.afc_courses, public.afc_assessments to anon, authenticated;
grant select on public.afc_enrollments, public.afc_enrollment_requests, public.afc_submissions, public.afc_certificates, public.afc_assessment_attempts, public.afc_assessment_integrity_events to authenticated;
grant insert on public.afc_enrollment_requests, public.afc_submissions to authenticated;
grant select on public.businesses, public.business_menu_items, public.business_orders, public.business_students, public.business_attendance, public.business_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('project-assets', 'project-assets', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'application/pdf', 'text/plain', 'text/csv', 'application/json', 'application/zip', 'application/x-zip-compressed', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  ('studio-assets', 'studio-assets', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'application/pdf', 'text/plain', 'text/csv', 'application/json']),
  ('conversation-media', 'conversation-media', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'application/pdf']),
  ('afc-assets', 'afc-assets', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_private on storage.objects for all to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy studio_assets_private on storage.objects for all to authenticated using (bucket_id = 'studio-assets' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'studio-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy conversation_media_private on storage.objects for all to authenticated using (bucket_id = 'conversation-media' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'conversation-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy project_assets_insert_owner on storage.objects for insert to authenticated with check (bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy project_assets_read_owner on storage.objects for select to authenticated using (bucket_id = 'project-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy afc_assets_read_enrolled on storage.objects for select to authenticated using (bucket_id = 'afc-assets' and (public.is_admin() or exists (select 1 from public.afc_enrollments where user_id = auth.uid() and course_id = (storage.foldername(name))[1] and status in ('active', 'completed'))));

-- Only selected private collaboration tables are replicated to Supabase Realtime.
alter publication supabase_realtime add table public.project_messages, public.support_messages, public.call_signals, public.project_events;
