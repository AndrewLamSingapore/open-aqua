-- VELYQUA Cloud Stable Spine v1 persistence.
-- Commercial data stays inside the VELYQUA Supabase project.

create table if not exists public.spine_trust_registry (
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  policy_state text not null check (policy_state in ('AUTO','BOUNDED_AUTO','GATED','PROHIBITED')),
  trust_score numeric not null default 0 check (trust_score between 0 and 1),
  clean_successes bigint not null default 0 check (clean_successes >= 0),
  failures bigint not null default 0 check (failures >= 0),
  platform_locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, action_type)
);

create table if not exists public.spine_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  correlation_id text not null,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists spine_events_user_created_idx on public.spine_events(user_id, created_at desc);
create index if not exists spine_events_correlation_idx on public.spine_events(user_id, correlation_id);

create table if not exists public.spine_audit_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  correlation_id text not null,
  idempotency_key text not null,
  action_type text not null,
  actor_type text not null,
  actor_id text not null,
  policy_state text not null,
  policy_reason text not null,
  execution_status text not null default 'NOT_EXECUTED',
  verification_status text not null default 'PENDING',
  outcome_status text not null default 'PENDING',
  envelope jsonb not null,
  decision_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index if not exists spine_audit_user_created_idx on public.spine_audit_log(user_id, created_at desc);
create index if not exists spine_audit_correlation_idx on public.spine_audit_log(user_id, correlation_id);

alter table public.spine_trust_registry enable row level security;
alter table public.spine_trust_registry force row level security;
alter table public.spine_events enable row level security;
alter table public.spine_events force row level security;
alter table public.spine_audit_log enable row level security;
alter table public.spine_audit_log force row level security;

create policy "owners_read_spine_trust" on public.spine_trust_registry for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners_read_spine_events" on public.spine_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners_read_spine_audit" on public.spine_audit_log for select to authenticated using ((select auth.uid()) = user_id);

-- Clients cannot mutate authority/evidence stores directly. Server-side code with service-role credentials owns writes.
revoke all on public.spine_trust_registry from anon, authenticated;
revoke all on public.spine_events from anon, authenticated;
revoke all on public.spine_audit_log from anon, authenticated;
grant select on public.spine_trust_registry to authenticated;
grant select on public.spine_events to authenticated;
grant select on public.spine_audit_log to authenticated;