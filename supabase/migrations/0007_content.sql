-- Phase 7: content/reel tracker. Metrics are manual for V1; the `source` column lets
-- API integrations (Instagram/YouTube) write their own rows later without a schema change.
alter table public.content_items
  add column if not exists hook text,
  add column if not exists caption text,
  add column if not exists topic text,
  add column if not exists notes text,
  add column if not exists reference_url text,
  add column if not exists thumbnail_url text;
create index if not exists content_user_status_idx on public.content_items (user_id, status);

create table public.content_platforms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.content_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  source text not null default 'manual',
  views int check (views >= 0), likes int check (likes >= 0), comments int check (comments >= 0),
  shares int check (shares >= 0), saves int check (saves >= 0), followers_gained int,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_item_id, source)
);

-- Posting rhythm: every `interval_days` days counted from `start_date` (suggestions only, never enforced)
create table public.content_schedule (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  start_date date not null,
  interval_days int not null default 2 check (interval_days between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['content_platforms','content_metrics','content_schedule']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_own', t);
  end loop;
end $$;
create trigger content_metrics_updated_at before update on public.content_metrics for each row execute function public.set_updated_at();
create trigger content_schedule_updated_at before update on public.content_schedule for each row execute function public.set_updated_at();

create or replace function public.seed_content_platforms(uid uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.content_platforms (user_id, name)
  select uid, n from unnest(array['Instagram','YouTube','LinkedIn']) as n
  on conflict (user_id, name) do nothing;
$$;
revoke all on function public.seed_content_platforms(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  perform public.seed_learning_categories(new.id);
  perform public.seed_workout_programs(new.id);
  perform public.seed_expense_categories(new.id);
  perform public.seed_content_platforms(new.id);
  return new;
end $$;

select public.seed_content_platforms(id) from public.profiles;
insert into public.content_platforms (user_id, name)
  select distinct user_id, platform from public.content_items where platform is not null on conflict do nothing;
