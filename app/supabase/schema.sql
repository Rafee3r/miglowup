-- MiGlowUp — Schema inicial
-- Copia y pega este archivo entero en Supabase Studio → SQL Editor → Run

-- ============================================
-- PROFILES (perfil de cada usuaria)
-- ============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  goal text,
  level text,
  age int,
  onboarded boolean default false,
  subscription_status text default 'trialing',
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users insert own profile" on profiles;
create policy "Users insert own profile" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger: cuando se crea un user en auth.users, crea su profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- MEASUREMENTS (tracking de peso/medidas)
-- ============================================
create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  waist_cm numeric(5,2),
  hip_cm numeric(5,2),
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_measurements_user_created on measurements(user_id, created_at desc);

alter table measurements enable row level security;

drop policy if exists "Users CRUD own measurements" on measurements;
create policy "Users CRUD own measurements" on measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- ROUTINE_LOGS (rutinas completadas)
-- ============================================
create table if not exists routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_slug text not null,
  duration_min int,
  completed_at timestamptz default now()
);

create index if not exists idx_routine_logs_user on routine_logs(user_id, completed_at desc);

alter table routine_logs enable row level security;

drop policy if exists "Users CRUD own routine_logs" on routine_logs;
create policy "Users CRUD own routine_logs" on routine_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- COACH_MESSAGES (historial chat IA — opcional)
-- ============================================
create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_coach_messages_user on coach_messages(user_id, created_at);

alter table coach_messages enable row level security;

drop policy if exists "Users CRUD own coach_messages" on coach_messages;
create policy "Users CRUD own coach_messages" on coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
