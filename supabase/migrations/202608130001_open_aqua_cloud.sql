-- Open Aqua 0.2: private, cloud-synchronised tank documents.
-- Run this once in a new Supabase project's SQL editor.

create table if not exists public.tank_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ? 'id'
    and payload ? 'name'
    and payload ? 'readings'
    and payload ? 'activities'
  ),
  client_updated_at timestamptz not null,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists tank_documents_user_updated_idx
  on public.tank_documents (user_id, updated_at desc);

create or replace function public.set_open_aqua_updated_at()
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

drop trigger if exists tank_documents_set_updated_at on public.tank_documents;
create trigger tank_documents_set_updated_at
before update on public.tank_documents
for each row execute function public.set_open_aqua_updated_at();

alter table public.tank_documents enable row level security;
alter table public.tank_documents force row level security;

drop policy if exists "owners_select_tank_documents" on public.tank_documents;
create policy "owners_select_tank_documents"
on public.tank_documents for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "owners_insert_tank_documents" on public.tank_documents;
create policy "owners_insert_tank_documents"
on public.tank_documents for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "owners_update_tank_documents" on public.tank_documents;
create policy "owners_update_tank_documents"
on public.tank_documents for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "owners_delete_tank_documents" on public.tank_documents;
create policy "owners_delete_tank_documents"
on public.tank_documents for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.tank_documents from anon;
grant select, insert, update, delete on public.tank_documents to authenticated;

-- Atomic compare-and-swap. A device must name the cloud revision it read.
-- If another device won the race, the app pulls, merges independent logs, and retries.
create or replace function public.save_tank_document(
  p_id text,
  p_payload jsonb,
  p_client_updated_at timestamptz,
  p_expected_revision bigint
)
returns public.tank_documents
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
  saved public.tank_documents;
begin
  if owner_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_id is null or char_length(p_id) not between 1 and 120 then
    raise exception 'Invalid tank id' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload) <> 'object'
     or not (p_payload ? 'id' and p_payload ? 'name' and p_payload ? 'readings' and p_payload ? 'activities')
     or p_payload ->> 'id' <> p_id then
    raise exception 'Invalid tank payload' using errcode = '22023';
  end if;

  if p_expected_revision = 0 then
    insert into public.tank_documents (user_id, id, payload, client_updated_at, revision)
    values (owner_id, p_id, p_payload, p_client_updated_at, 1)
    on conflict (user_id, id) do nothing
    returning * into saved;
  else
    update public.tank_documents
       set payload = p_payload,
           client_updated_at = p_client_updated_at,
           revision = revision + 1
     where user_id = owner_id
       and id = p_id
       and revision = p_expected_revision
    returning * into saved;
  end if;

  if saved is null then
    raise exception 'Cloud record changed; pull and merge before retrying' using errcode = '40001';
  end if;
  return saved;
end;
$$;

revoke all on function public.save_tank_document(text, jsonb, timestamptz, bigint) from public, anon;
grant execute on function public.save_tank_document(text, jsonb, timestamptz, bigint) to authenticated;

-- Realtime lets a second signed-in device notice changes. RLS still controls access.
do $$
begin
  alter publication supabase_realtime add table public.tank_documents;
exception
  when duplicate_object then null;
end $$;
