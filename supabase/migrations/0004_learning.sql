-- Phase 4: learning tracker.
alter table public.learning_sessions
  add column if not exists subtopic text,
  add column if not exists difficulty smallint check (difficulty between 1 and 5),
  add column if not exists what_learned text,
  add column if not exists confused text,
  add column if not exists resources text,
  add column if not exists next_action text;

create table public.learning_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.learning_categories enable row level security;
create policy learning_categories_own on public.learning_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.revision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete set null,
  topic text not null,
  note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index revision_open_idx on public.revision_items (user_id, created_at desc) where resolved_at is null;
alter table public.revision_items enable row level security;
create policy revision_items_own on public.revision_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.seed_learning_categories(uid uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.learning_categories (user_id, name)
  select uid, n from unnest(array[
    'Automotive Cybersecurity','Networking','Linux','Web Security','Penetration Testing','DevSecOps',
    'ISO/SAE 21434','UDS','CAN','TARA','CSMS','Programming','Interview Preparation','Other'
  ]) as n
  on conflict (user_id, name) do nothing;
$$;
revoke all on function public.seed_learning_categories(uuid) from public, anon, authenticated;

-- new users get the defaults at signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  perform public.seed_learning_categories(new.id);
  return new;
end $$;

-- backfill existing users
select public.seed_learning_categories(id) from public.profiles;

alter publication supabase_realtime add table public.revision_items;
