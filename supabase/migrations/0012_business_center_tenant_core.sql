-- AuraFlow Business Center: control plane and tenant-safe school foundation.
-- This intentionally does not alter the legacy single-business runtime tables.

create table public.business_center_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email citext not null,
  phone text check (phone is null or char_length(phone) <= 40),
  school_name text not null check (char_length(school_name) between 2 and 180),
  role_title text not null check (char_length(role_title) between 2 and 80),
  student_band text not null check (student_band in ('1-100', '101-300', '301-800', '801-2000', '2000+')),
  message text not null default '' check (char_length(message) <= 3000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_center_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 180),
  owner_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_center_tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.business_center_organizations(id) on delete restrict,
  kind text not null check (kind in ('school')),
  name text not null check (char_length(name) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  lifecycle text not null default 'provisioning' check (lifecycle in ('draft', 'provisioning', 'ready', 'active', 'suspended', 'archived')),
  branding jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_center_tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.business_center_tenants(id) on delete cascade,
  hostname text not null unique check (hostname ~ '^[a-z0-9][a-z0-9.-]{1,251}[a-z0-9]$'),
  domain_type text not null default 'subdomain' check (domain_type in ('subdomain', 'custom')),
  status text not null default 'reserved' check (status in ('reserved', 'verified', 'active', 'failed', 'retired')),
  verification_note text not null default '' check (char_length(verification_note) <= 2000),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, hostname)
);

create table public.business_center_tenant_memberships (
  tenant_id uuid not null references public.business_center_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('school_owner', 'school_admin', 'teacher', 'student', 'parent', 'hr_staff', 'finance_officer', 'librarian', 'it_support')),
  status text not null default 'active' check (status in ('pending', 'active', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.business_center_tenant_entitlements (
  tenant_id uuid primary key references public.business_center_tenants(id) on delete cascade,
  plan text not null check (plan in ('trial', 'starter', 'professional', 'enterprise')),
  student_limit integer check (student_limit is null or student_limit between 1 and 100000),
  modules jsonb not null default '[]'::jsonb,
  trial_ends_at timestamptz,
  billing_state text not null default 'pending' check (billing_state in ('pending', 'trial', 'active', 'past_due', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_center_provisioning_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  school_name text not null check (char_length(school_name) between 2 and 180),
  preferred_slug text not null check (preferred_slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  school_type text not null check (char_length(school_type) between 2 and 80),
  student_band text not null check (student_band in ('1-100', '101-300', '301-800', '801-2000', '2000+')),
  staff_band text not null check (staff_band in ('1-15', '16-50', '51-150', '151+')),
  curriculum text not null check (char_length(curriculum) between 2 and 180),
  launch_target date,
  requested_modules jsonb not null default '[]'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  notes text not null default '' check (char_length(notes) <= 6000),
  status text not null default 'submitted' check (status in ('submitted', 'discovery', 'approved', 'provisioning', 'ready', 'declined', 'cancelled')),
  admin_note text not null default '' check (char_length(admin_note) <= 6000),
  reviewed_by uuid references auth.users(id) on delete set null,
  tenant_id uuid unique references public.business_center_tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_center_provisioning_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.business_center_provisioning_requests(id) on delete cascade,
  tenant_id uuid references public.business_center_tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 120),
  detail text not null default '' check (char_length(detail) <= 6000),
  created_at timestamptz not null default now()
);

create index business_center_leads_status_created_idx on public.business_center_leads (status, created_at desc);
create index business_center_tenants_org_idx on public.business_center_tenants (organization_id, created_at desc);
create index business_center_domains_tenant_idx on public.business_center_tenant_domains (tenant_id, status);
create index business_center_memberships_user_idx on public.business_center_tenant_memberships (user_id, status);
create index business_center_requests_requester_idx on public.business_center_provisioning_requests (requested_by, updated_at desc);
create index business_center_requests_status_idx on public.business_center_provisioning_requests (status, updated_at desc);
create index business_center_events_request_idx on public.business_center_provisioning_events (request_id, created_at asc);

create trigger business_center_leads_updated_at before update on public.business_center_leads for each row execute procedure public.set_updated_at();
create trigger business_center_organizations_updated_at before update on public.business_center_organizations for each row execute procedure public.set_updated_at();
create trigger business_center_tenants_updated_at before update on public.business_center_tenants for each row execute procedure public.set_updated_at();
create trigger business_center_domains_updated_at before update on public.business_center_tenant_domains for each row execute procedure public.set_updated_at();
create trigger business_center_memberships_updated_at before update on public.business_center_tenant_memberships for each row execute procedure public.set_updated_at();
create trigger business_center_entitlements_updated_at before update on public.business_center_tenant_entitlements for each row execute procedure public.set_updated_at();
create trigger business_center_requests_updated_at before update on public.business_center_provisioning_requests for each row execute procedure public.set_updated_at();

create or replace function public.is_business_center_tenant_member(target_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.business_center_tenant_memberships
    where tenant_id = target_tenant_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.can_manage_business_center_tenant(target_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.business_center_tenant_memberships
    where tenant_id = target_tenant_id and user_id = auth.uid() and status = 'active'
      and role in ('school_owner', 'school_admin')
  );
$$;

alter table public.business_center_leads enable row level security;
alter table public.business_center_organizations enable row level security;
alter table public.business_center_tenants enable row level security;
alter table public.business_center_tenant_domains enable row level security;
alter table public.business_center_tenant_memberships enable row level security;
alter table public.business_center_tenant_entitlements enable row level security;
alter table public.business_center_provisioning_requests enable row level security;
alter table public.business_center_provisioning_events enable row level security;

create policy business_center_organizations_read on public.business_center_organizations for select to authenticated using (
  public.is_admin() or exists (select 1 from public.business_center_tenants t where t.organization_id = id and public.is_business_center_tenant_member(t.id))
);
create policy business_center_tenants_read on public.business_center_tenants for select to authenticated using (public.is_business_center_tenant_member(id));
create policy business_center_domains_read on public.business_center_tenant_domains for select to authenticated using (public.is_business_center_tenant_member(tenant_id));
create policy business_center_memberships_read on public.business_center_tenant_memberships for select to authenticated using (
  public.is_admin() or user_id = auth.uid() or public.can_manage_business_center_tenant(tenant_id)
);
create policy business_center_entitlements_read on public.business_center_tenant_entitlements for select to authenticated using (public.is_business_center_tenant_member(tenant_id));
create policy business_center_requests_read on public.business_center_provisioning_requests for select to authenticated using (requested_by = auth.uid() or public.is_admin());
create policy business_center_requests_insert on public.business_center_provisioning_requests for insert to authenticated with check (requested_by = auth.uid());
create policy business_center_events_read on public.business_center_provisioning_events for select to authenticated using (
  public.is_admin() or exists (select 1 from public.business_center_provisioning_requests r where r.id = request_id and r.requested_by = auth.uid()) or (tenant_id is not null and public.is_business_center_tenant_member(tenant_id))
);

grant select on public.business_center_organizations, public.business_center_tenants, public.business_center_tenant_domains, public.business_center_tenant_memberships, public.business_center_tenant_entitlements, public.business_center_provisioning_requests, public.business_center_provisioning_events to authenticated;
grant insert on public.business_center_provisioning_requests to authenticated;

create or replace function public.provision_business_center_school(
  p_request_id uuid,
  p_tenant_slug text,
  p_plan text,
  p_base_domain text,
  p_actor_id uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  request_row public.business_center_provisioning_requests;
  organization_uuid uuid;
  tenant_uuid uuid;
  module_list jsonb;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_tenant_slug !~ '^[a-z0-9][a-z0-9-]{2,62}$' then raise exception 'Invalid tenant slug'; end if;
  if p_base_domain !~ '^[a-z0-9][a-z0-9.-]{1,251}[a-z0-9]$' then raise exception 'Invalid base domain'; end if;
  if p_plan not in ('trial', 'starter', 'professional', 'enterprise') then raise exception 'Invalid plan'; end if;

  select * into request_row from public.business_center_provisioning_requests where id = p_request_id for update;
  if not found then raise exception 'Provisioning request not found'; end if;
  if request_row.status not in ('approved', 'provisioning') then raise exception 'Request must be approved before provisioning'; end if;
  if request_row.tenant_id is not null then return request_row.tenant_id; end if;

  module_list := request_row.requested_modules;
  insert into public.business_center_organizations (name, owner_id) values (request_row.school_name, request_row.requested_by) returning id into organization_uuid;
  insert into public.business_center_tenants (organization_id, kind, name, slug, lifecycle, branding, settings)
  values (organization_uuid, 'school', request_row.school_name, p_tenant_slug, 'provisioning', request_row.branding, jsonb_build_object('curriculum', request_row.curriculum, 'school_type', request_row.school_type))
  returning id into tenant_uuid;
  insert into public.business_center_tenant_memberships (tenant_id, user_id, role, status) values (tenant_uuid, request_row.requested_by, 'school_owner', 'active');
  insert into public.business_center_tenant_domains (tenant_id, hostname, domain_type, status) values (tenant_uuid, p_tenant_slug || '.' || p_base_domain, 'subdomain', 'reserved');
  insert into public.business_center_tenant_entitlements (tenant_id, plan, student_limit, modules, trial_ends_at, billing_state)
  values (tenant_uuid, p_plan, case p_plan when 'trial' then 100 when 'starter' then 300 else null end, module_list, case when p_plan = 'trial' then now() + interval '90 days' else null end, case when p_plan = 'trial' then 'trial' else 'pending' end);
  update public.business_center_provisioning_requests set status = 'provisioning', tenant_id = tenant_uuid, reviewed_by = p_actor_id where id = request_row.id;
  insert into public.business_center_provisioning_events (request_id, tenant_id, actor_id, event_type, detail) values (request_row.id, tenant_uuid, p_actor_id, 'tenant-provisioned', 'Tenant, owner membership, subdomain reservation, and plan entitlements created.');
  return tenant_uuid;
end;
$$;

create or replace function public.advance_business_center_tenant(
  p_tenant_id uuid,
  p_lifecycle text,
  p_note text,
  p_actor_id uuid
) returns void language plpgsql security definer set search_path = public as $$
declare request_uuid uuid;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_lifecycle not in ('ready', 'active', 'suspended', 'archived') then raise exception 'Invalid tenant lifecycle'; end if;
  update public.business_center_tenants set lifecycle = p_lifecycle where id = p_tenant_id;
  if not found then raise exception 'Tenant not found'; end if;
  if p_lifecycle in ('ready', 'active') then
    update public.business_center_tenant_domains set status = case when p_lifecycle = 'ready' then 'verified' else 'active' end, verified_at = coalesce(verified_at, now()), verification_note = p_note where tenant_id = p_tenant_id and domain_type = 'subdomain';
  end if;
  select id into request_uuid from public.business_center_provisioning_requests where tenant_id = p_tenant_id;
  if request_uuid is not null then
    update public.business_center_provisioning_requests set status = case when p_lifecycle = 'ready' then 'ready' when p_lifecycle = 'active' then 'ready' else status end, reviewed_by = p_actor_id where id = request_uuid;
    insert into public.business_center_provisioning_events (request_id, tenant_id, actor_id, event_type, detail) values (request_uuid, p_tenant_id, p_actor_id, 'tenant-' || p_lifecycle, p_note);
  end if;
end;
$$;

revoke all on function public.provision_business_center_school(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.advance_business_center_tenant(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.provision_business_center_school(uuid, text, text, text, uuid) to service_role;
grant execute on function public.advance_business_center_tenant(uuid, text, text, uuid) to service_role;
