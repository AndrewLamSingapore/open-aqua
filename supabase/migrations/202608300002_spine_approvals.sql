-- VELYQUA Cloud Stable Spine v1 approvals and trust evidence.

create table if not exists public.spine_approvals (
  approval_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  correlation_id text not null,
  idempotency_key text not null,
  action_type text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED')),
  envelope jsonb not null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id),
  unique (user_id, idempotency_key)
);
create index if not exists spine_approvals_user_status_idx on public.spine_approvals(user_id, status, requested_at desc);

create table if not exists public.spine_trust_evidence (
  evidence_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  outcome text not null check (outcome in ('CLEAN_SUCCESS','FAILURE','SERIOUS_FAILURE','UNCERTAIN')),
  audit_id bigint references public.spine_audit_log(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists spine_trust_evidence_user_action_idx on public.spine_trust_evidence(user_id, action_type, created_at desc);

alter table public.spine_approvals enable row level security;
alter table public.spine_approvals force row level security;
alter table public.spine_trust_evidence enable row level security;
alter table public.spine_trust_evidence force row level security;

create policy "owners_read_spine_approvals" on public.spine_approvals for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners_read_spine_trust_evidence" on public.spine_trust_evidence for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.spine_approvals from anon, authenticated;
revoke all on public.spine_trust_evidence from anon, authenticated;
grant select on public.spine_approvals to authenticated;
grant select on public.spine_trust_evidence to authenticated;
