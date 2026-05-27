-- ════════════════════════════════════════════════════════════
-- MIGRATION: Eventos comunitarios + perfiles visibles
-- ════════════════════════════════════════════════════════════
-- Correr este SQL en Supabase Studio → SQL Editor → Run
-- Después correr el INSERT del evento "41 días de primavera"
-- al final del archivo para seedear el primer reto.

-- ────────── 1. Tabla events ──────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  emoji text default '🌸',
  color_from text default '#FFB294',
  color_to text default '#F26A47',
  start_date date not null,
  end_date date not null,
  goal_workouts int default 30,
  cover_image text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_events_dates on events(start_date, end_date);

alter table events enable row level security;

drop policy if exists "Anyone authenticated reads events" on events;
create policy "Anyone authenticated reads events" on events
  for select using (auth.role() = 'authenticated');

-- ────────── 2. Tabla event_participants ──────────
create table if not exists event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(event_id, user_id)
);

create index if not exists idx_ep_event on event_participants(event_id);
create index if not exists idx_ep_user on event_participants(user_id);

alter table event_participants enable row level security;

drop policy if exists "Participants visible to authenticated" on event_participants;
create policy "Participants visible to authenticated" on event_participants
  for select using (auth.role() = 'authenticated');

drop policy if exists "Users can join events" on event_participants;
create policy "Users can join events" on event_participants
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can leave own participation" on event_participants;
create policy "Users can leave own participation" on event_participants
  for delete using (auth.uid() = user_id);

-- ────────── 3. Extender profiles con campos sociales ──────────
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists location text default 'Chile';
alter table profiles add column if not exists is_public boolean default true;

-- Permitir leer profiles de usuarios PÚBLICOS (para leaderboards/eventos)
drop policy if exists "Authenticated read public profiles" on profiles;
create policy "Authenticated read public profiles" on profiles
  for select using (
    auth.role() = 'authenticated' AND (is_public = true OR auth.uid() = id)
  );

-- ────────── 4. Subscriptions table (para mostrar billing status) ──────────
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preapproval_id text unique,
  plan text not null,
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  next_billing_at timestamptz,
  amount int,
  currency text default 'CLP',
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sub_user on subscriptions(user_id);

alter table subscriptions enable row level security;

drop policy if exists "Users read own subscription" on subscriptions;
create policy "Users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Service inserts subscriptions" on subscriptions;
create policy "Service inserts subscriptions" on subscriptions
  for insert with check (true);

drop policy if exists "Service updates subscriptions" on subscriptions;
create policy "Service updates subscriptions" on subscriptions
  for update using (true);

-- ────────── 5. Seed: evento "41 días de primavera" ──────────
insert into events (slug, title, subtitle, description, emoji, color_from, color_to, start_date, end_date, goal_workouts, is_featured)
values (
  '41-dias-primavera',
  '41 días de primavera',
  'El reto que arranca con la estación',
  'Entrena 30 de los 41 días de la primavera. Una rutina de mínimo 15 minutos cuenta. Únete a la cohorte fundadora.',
  '🌸',
  '#FFB294',
  '#F26A47',
  '2026-09-22',
  '2026-11-01',
  30,
  true
) on conflict (slug) do nothing;

-- Para activarlo HOY como prueba, usa fechas actuales:
-- update events set start_date = current_date, end_date = current_date + 40
-- where slug = '41-dias-primavera';
