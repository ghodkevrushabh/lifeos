-- Phase 9: saved weekly/monthly reflections. period_start = Monday (week) or 1st of month (month).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('week','month')),
  period_start date not null,
  went_well text,
  didnt_go_well text,
  change_next text,
  income numeric(12,2) check (income >= 0),   -- optional, monthly reviews only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, period_start)
);
alter table public.reviews enable row level security;
create policy reviews_own on public.reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
