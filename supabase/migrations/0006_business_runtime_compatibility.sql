-- Bring the business runtime schema in line with the existing audited order
-- contract. Existing records are preserved and receive safe defaults.
alter table public.business_orders
  add column if not exists address text not null default '',
  add column if not exists note text not null default '',
  add column if not exists whatsapp_consent boolean not null default false,
  add column if not exists currency text not null default 'GHS',
  add column if not exists delivery_fee_ghs numeric(12, 2) not null default 0;

alter table public.business_orders
  drop constraint if exists business_orders_status_check;
alter table public.business_orders
  add constraint business_orders_status_check check (status in ('received', 'accepted', 'preparing', 'ready', 'out-for-delivery', 'completed', 'cancelled'));

create table public.business_outbound (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.business_orders(id) on delete cascade,
  order_status text not null,
  state text not null check (state in ('submitting', 'accepted', 'sent', 'delivered', 'read', 'failed', 'needs-review')),
  message_id text unique,
  actor_id uuid references auth.users(id) on delete set null,
  provider_timestamp bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_id, order_status)
);

create index business_outbound_business_created_idx on public.business_outbound (business_id, created_at desc);

create table public.business_whatsapp_receipts (
  message_id_hash text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  outbound_id uuid not null references public.business_outbound(id) on delete cascade,
  phone_number_id text not null,
  created_at timestamptz not null default now()
);

create trigger business_outbound_updated_at before update on public.business_outbound for each row execute procedure public.set_updated_at();

alter table public.business_outbound enable row level security;
alter table public.business_whatsapp_receipts enable row level security;
create policy business_outbound_owner_read on public.business_outbound for select to authenticated using (
  exists (select 1 from public.businesses where id = business_id and (owner_id = auth.uid() or public.is_admin()))
);
grant select on public.business_outbound to authenticated;
