-- Phase 6: expense categories + monthly budgets. expenses.category keeps the category name (text),
-- expense_categories is the user's list of choices (same pattern as learning categories).
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.expense_categories enable row level security;
create policy expense_categories_own on public.expense_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One budget per month (first day of month). Months without a row inherit the latest earlier budget in the app.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);
alter table public.budgets enable row level security;
create policy budgets_own on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

create or replace function public.seed_expense_categories(uid uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.expense_categories (user_id, name)
  select uid, n from unnest(array['Food','Transport','Shopping','Bills','Entertainment','Health',
    'Fitness','Education','Subscriptions','Work','Other']) as n
  on conflict (user_id, name) do nothing;
$$;
revoke all on function public.seed_expense_categories(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  perform public.seed_learning_categories(new.id);
  perform public.seed_workout_programs(new.id);
  perform public.seed_expense_categories(new.id);
  return new;
end $$;

select public.seed_expense_categories(id) from public.profiles;
-- make sure categories used by any existing expenses are selectable
insert into public.expense_categories (user_id, name)
  select distinct user_id, category from public.expenses on conflict do nothing;
