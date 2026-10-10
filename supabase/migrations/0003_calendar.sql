-- Phase 3: calendar events + realtime publication.
-- Events are single-day with wall-clock times in the user's timezone (no timestamptz => no tz drift).
-- start_time NULL means all-day.
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text,
  category text not null default 'personal'
    check (category in ('workout','learning','content','personal','work','other')),
  event_date date not null,
  start_time time,
  end_time time,
  content_item_id uuid references public.content_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time >= start_time)
);
create index calendar_events_user_date_idx on public.calendar_events (user_id, event_date);

alter table public.calendar_events enable row level security;
create policy calendar_events_own on public.calendar_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- Realtime (RLS still applies to what each user receives)
alter publication supabase_realtime add table
  public.calendar_events, public.expenses, public.learning_sessions,
  public.workout_sessions, public.content_items, public.daily_checkins;
