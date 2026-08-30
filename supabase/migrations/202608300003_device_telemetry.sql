create table if not exists public.device_registry (
  device_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  token_hash text not null,
  enabled boolean not null default true,
  last_seen_at timestamptz,
  firmware_version text,
  created_at timestamptz not null default now()
);
create index if not exists device_registry_user_idx on public.device_registry(user_id, created_at desc);

create table if not exists public.sensor_readings (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.device_registry(device_id) on delete cascade,
  tank_id text not null,
  metric text not null,
  value double precision not null,
  unit text,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists sensor_readings_user_tank_metric_idx on public.sensor_readings(user_id,tank_id,metric,observed_at desc);
create index if not exists sensor_readings_device_idx on public.sensor_readings(device_id,observed_at desc);

alter table public.device_registry enable row level security;
alter table public.device_registry force row level security;
alter table public.sensor_readings enable row level security;
alter table public.sensor_readings force row level security;

create policy "owners_read_devices" on public.device_registry for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners_read_sensor_readings" on public.sensor_readings for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.device_registry from anon, authenticated;
revoke all on public.sensor_readings from anon, authenticated;
grant select on public.device_registry to authenticated;
grant select on public.sensor_readings to authenticated;
