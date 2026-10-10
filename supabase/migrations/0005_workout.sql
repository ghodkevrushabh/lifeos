-- Phase 5: workout programs (A/B templates), exercises, per-set logs.
create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (label in ('A','B')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, label)
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  position int not null default 1,
  name text not null check (char_length(name) between 1 and 80),
  muscle_group text, movement_type text, equipment text,
  sets int not null default 3 check (sets between 1 and 10),
  target_reps int check (target_reps > 0),
  target_seconds int check (target_seconds > 0),   -- set for timed holds (plank etc.)
  rest_seconds int not null default 60 check (rest_seconds >= 0),
  difficulty smallint check (difficulty between 1 and 5),
  notes text, instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_exercises_program_idx on public.workout_exercises (program_id, position);

alter table public.workout_sessions add column if not exists program_id uuid references public.workout_programs(id) on delete set null;

-- exercise_name and session_date are snapshots so history survives template edits/deletes
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.workout_exercises(id) on delete set null,
  exercise_name text not null,
  session_date date not null,
  set_number int not null check (set_number between 1 and 20),
  reps int check (reps >= 0),
  weight_kg numeric(6,2) check (weight_kg >= 0),
  seconds int check (seconds >= 0),
  rpe numeric(3,1) check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create index workout_sets_progress_idx on public.workout_sets (user_id, exercise_name, session_date desc);
create index workout_sets_session_idx on public.workout_sets (session_id);

do $$
declare t text;
begin
  foreach t in array array['workout_programs','workout_exercises','workout_sets']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_own', t);
  end loop;
end $$;
create trigger workout_programs_updated_at before update on public.workout_programs for each row execute function public.set_updated_at();
create trigger workout_exercises_updated_at before update on public.workout_exercises for each row execute function public.set_updated_at();

create or replace function public.seed_workout_programs(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a uuid; b uuid;
begin
  if exists (select 1 from public.workout_programs where user_id = uid) then return; end if;
  insert into public.workout_programs (user_id, label, name) values (uid, 'A', 'Workout A') returning id into a;
  insert into public.workout_programs (user_id, label, name) values (uid, 'B', 'Workout B') returning id into b;
  insert into public.workout_exercises
    (user_id, program_id, position, name, muscle_group, movement_type, equipment, sets, target_reps, target_seconds, rest_seconds) values
    (uid, a, 1, 'Standard Push-ups', 'Chest', 'Push', 'None', 3, 10, null, 60),
    (uid, a, 2, 'Bodyweight Squats', 'Quads', 'Squat', 'None', 3, 15, null, 60),
    (uid, a, 3, 'Inverted Rows', 'Back', 'Pull', 'Bar or sturdy table', 3, 8, null, 60),
    (uid, a, 4, 'Glute Bridges', 'Glutes', 'Hinge', 'None', 3, 15, null, 45),
    (uid, a, 5, 'Pike Push-ups', 'Shoulders', 'Push', 'None', 3, 8, null, 60),
    (uid, a, 6, 'Forearm Plank', 'Core', 'Isometric', 'None', 3, null, 30, 45),
    (uid, b, 1, 'Bulgarian Split Squats', 'Quads', 'Squat', 'Bench or chair', 3, 8, null, 60),
    (uid, b, 2, 'Decline Push-ups', 'Chest', 'Push', 'Bench or chair', 3, 10, null, 60),
    (uid, b, 3, 'Pull-ups / Superman back extensions', 'Back', 'Pull', 'Pull-up bar', 3, 6, null, 60),
    (uid, b, 4, 'Sliding Leg Curls', 'Hamstrings', 'Hinge', 'Towel or sliders', 3, 8, null, 60),
    (uid, b, 5, 'Lateral Raises', 'Shoulders', 'Raise', 'Dumbbells or bottles', 3, 12, null, 45),
    (uid, b, 6, 'Hollow Body Hold', 'Core', 'Isometric', 'None', 3, null, 20, 45);
end $$;
revoke all on function public.seed_workout_programs(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  perform public.seed_learning_categories(new.id);
  perform public.seed_workout_programs(new.id);
  return new;
end $$;

select public.seed_workout_programs(id) from public.profiles;

alter publication supabase_realtime add table public.workout_sets;
