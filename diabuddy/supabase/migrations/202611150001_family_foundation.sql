-- Restrictive foundation only. Backend-managed writes are intentionally unavailable
-- to anon/authenticated until authenticated endpoints and consent review exist.
create schema if not exists diabuddy_private;
revoke all on schema diabuddy_private from public, anon, authenticated;

create table public.db_families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table public.db_caregivers (
  family_id uuid not null references public.db_families(id),
  user_id uuid not null references auth.users(id),
  can_manage_family boolean not null default false,
  can_manage_billing boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (family_id,user_id)
);
create table public.db_children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.db_families(id),
  nickname text not null check (length(nickname) between 1 and 24),
  age smallint check (age between 0 and 120),
  child_user_id uuid unique references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id,family_id)
);
create table public.db_child_preferences (
  child_id uuid primary key references public.db_children(id),
  buddy jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.db_onboarding (
  user_id uuid primary key references auth.users(id),
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.db_consents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.db_children(id),
  caregiver_user_id uuid not null references auth.users(id),
  consent_type text not null,
  policy_version text not null,
  method text not null,
  provider_reference text,
  status text not null check(status in ('pending','verified','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.db_pairing_invitations (
  token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),
  child_id uuid not null references public.db_children(id),
  created_by uuid not null references auth.users(id),
  requested_by uuid references auth.users(id),
  state text not null check(state in ('open','pending','consumed','canceled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create unique index db_pairing_one_active_per_child on public.db_pairing_invitations(child_id) where state in ('open','pending');
create table public.db_subscriptions (
  family_id uuid primary key references public.db_families(id),
  billing_user_id uuid not null references auth.users(id),
  provider_customer_id text unique,
  provider_subscription_id text unique,
  plan_code text not null default 'free',
  status text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  scheduled_change jsonb,
  updated_at timestamptz not null default now()
);
create table public.db_child_entitlements (
  child_id uuid primary key references public.db_children(id),
  plan_code text not null default 'free',
  updated_at timestamptz not null default now()
);
create table diabuddy_private.stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);
-- SECURITY DEFINER helpers read membership without recursive RLS. Only return a
-- boolean, use a fixed search_path, and derive the caller from auth.uid().
create function diabuddy_private.is_caregiver(fid uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select auth.uid() is not null and exists(select 1 from public.db_caregivers c where c.family_id=fid and c.user_id=auth.uid()) $$;
create function diabuddy_private.can_view_child(cid uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select auth.uid() is not null and exists(select 1 from public.db_children c where c.id=cid and (c.child_user_id=auth.uid() or exists(select 1 from public.db_caregivers p where p.family_id=c.family_id and p.user_id=auth.uid())) and (c.age >= 13 or exists(select 1 from public.db_consents v where v.child_id=c.id and v.consent_type='child_personal_data' and v.status='verified'))) $$;
grant usage on schema diabuddy_private to authenticated;
grant execute on function diabuddy_private.is_caregiver(uuid), diabuddy_private.can_view_child(uuid) to authenticated;
revoke all on public.db_families, public.db_caregivers, public.db_children, public.db_child_preferences, public.db_onboarding, public.db_consents, public.db_pairing_invitations, public.db_subscriptions, public.db_child_entitlements from anon, authenticated;
alter table public.db_families enable row level security;
alter table public.db_caregivers enable row level security;
alter table public.db_children enable row level security;
alter table public.db_child_preferences enable row level security;
alter table public.db_onboarding enable row level security;
alter table public.db_consents enable row level security;
alter table public.db_pairing_invitations enable row level security;
alter table public.db_subscriptions enable row level security;
alter table public.db_child_entitlements enable row level security;
-- Invitation hashes, consent records and subscription/provider identifiers have
-- no direct client policies. Expose narrowly scoped data through backend APIs.
grant select on public.db_families, public.db_caregivers, public.db_children, public.db_child_preferences, public.db_onboarding, public.db_child_entitlements to authenticated;
create policy family_read on public.db_families for select to authenticated using (diabuddy_private.is_caregiver(id));
create policy caregivers_read on public.db_caregivers for select to authenticated using (diabuddy_private.is_caregiver(family_id));
create policy child_read on public.db_children for select to authenticated using (diabuddy_private.can_view_child(id));
create policy preferences_read on public.db_child_preferences for select to authenticated using (diabuddy_private.can_view_child(child_id));
create policy onboarding_read on public.db_onboarding for select to authenticated using (auth.uid()=user_id);
create policy entitlement_read on public.db_child_entitlements for select to authenticated using (diabuddy_private.can_view_child(child_id));
