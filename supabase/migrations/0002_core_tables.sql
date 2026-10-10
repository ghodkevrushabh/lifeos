-- Phase 2: core tables the Today/Dashboard read from. Later phases ALTER these (extra columns,
-- categories/programs tables). All rows are owned by user_id and protected by RLS.
-- Dates are `date` columns holding the user's local day, so timezone bugs can't shift records.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spent_on date not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',   -- Phase 6 normalizes into expense_categories
  description text,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_user_date_idx on public.expenses (user_id, spent_on desc);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_date date not null,
  topic text not null,
  category text,
  minutes int not null default 0 check (minutes >= 0),
  confidence smallint check (confidence between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index learning_user_date_idx on public.learning_sessions (user_id, session_date desc);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_date date not null,
  workout_label text check (workout_label in ('A','B')),  -- Phase 5 links to workout_programs
  status text not null default 'completed' check (status in ('planned','completed','skipped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_user_date_idx on public.workout_sessions (user_id, session_date desc);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  idea text not null,
  status text not null default 'idea'
    check (status in ('idea','planned','scripted','recorded','editing','ready','posted')),
  platform text,
  planned_date date,
  published_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_user_planned_idx on public.content_items (user_id, planned_date);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  checkin_date date not null,
  workout_done boolean not null default false,
  learning_done boolean not null default false,
  content_done boolean not null default false,
  expenses_logged boolean not null default false,
  energy smallint check (energy between 1 and 5),
  productivity smallint check (productivity between 1 and 5),
  accomplished text,
  improve text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

do $$
declare t text;
begin
  foreach t in array array['expenses','learning_sessions','workout_sessions','content_items','daily_checkins']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_own', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
