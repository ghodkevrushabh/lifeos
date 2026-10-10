-- Phase 10: notification prefs, demo-data support (rows flagged is_demo, removable in one click).
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{"learning":true,"workout":true,"content":true,"checkin":true}';

do $$
declare t text;
begin
  foreach t in array array['expenses','learning_sessions','workout_sessions','workout_sets','content_items','calendar_events','daily_checkins','revision_items']
  loop
    execute format('alter table public.%I add column if not exists is_demo boolean not null default false', t);
  end loop;
end $$;

create or replace function public._seed_demo(uid uuid) returns void language plpgsql as $$
declare tz text; d0 date; sid uuid; cid uuid; r record; i int; base int;
begin
  select coalesce(timezone, 'Asia/Kolkata') into tz from public.profiles where id = uid;
  d0 := (now() at time zone coalesce(tz, 'Asia/Kolkata'))::date;

  insert into public.learning_sessions (user_id, session_date, topic, category, minutes, confidence, difficulty, what_learned, confused, next_action, is_demo)
  select uid, d0 - o, t, c, m, conf, diff, nullif(learned, ''), nullif(confused, ''), nullif(nxt, ''), true
  from (values
    (0, 'UDS security access (0x27)', 'UDS', 45, 7, 3, 'Seed and key flow between tester and ECU', 'Why a delay timer follows failed attempts', 'Read about session timeouts'),
    (1, 'CAN arbitration and bit stuffing', 'CAN', 60, 6, 3, 'Lower ID wins arbitration without data loss', 'When stuff bits are added', 'Practice with a bus trace'),
    (2, 'TARA threat scenarios', 'TARA', 50, 6, 4, 'Damage scenarios link assets to threats', 'Attack feasibility rating', 'Draft a TARA for a BCM'),
    (3, 'ISO/SAE 21434 clause 15', 'ISO/SAE 21434', 40, 5, 4, 'Clause 15 covers threat analysis and risk assessment', 'Difference between risk and cybersecurity goals', 'Map clauses to work products'),
    (5, 'UDS session control (0x10)', 'UDS', 35, 5, 3, 'Default, extended and programming sessions', '', 'Try 0x10 requests in a simulator'),
    (6, 'CSMS overview', 'ISO/SAE 21434', 30, 4, 4, 'CSMS wraps cybersecurity across the vehicle lifecycle', 'How it ties to UNECE R155', 'Read R155 summary'),
    (8, 'Linux permissions refresher', 'Linux', 30, 7, 2, 'chmod, chown and umask basics', '', ''),
    (9, 'Intro to automotive cybersecurity', 'Automotive Cybersecurity', 45, 4, 3, 'Why connected cars widen the attack surface', 'ECU vs domain controller', 'List the main vehicle buses')
  ) as v(o, t, c, m, conf, diff, learned, confused, nxt);

  insert into public.revision_items (user_id, topic, note, is_demo) values
    (uid, 'CAN arbitration and bit stuffing', 'When stuff bits are added', true),
    (uid, 'TARA attack feasibility rating', 'Attack potential vs feasibility', true);

  for i in 0..5 loop
    insert into public.workout_sessions (user_id, session_date, workout_label, status, is_demo)
      values (uid, d0 - (i * 2 + 1), case when i % 2 = 0 then 'A' else 'B' end, 'completed', true) returning id into sid;
    base := 14 - i;
    if i % 2 = 0 then
      insert into public.workout_sets (user_id, session_id, exercise_name, session_date, set_number, reps, seconds, rpe, is_demo)
      select uid, sid, 'Standard Push-ups', d0 - (i * 2 + 1), n, base - (n - 1), null::int, 7 + (n - 1) * 0.5, true from generate_series(1, 3) n
      union all select uid, sid, 'Bodyweight Squats', d0 - (i * 2 + 1), n, 20 - i - (n - 1), null::int, 6, true from generate_series(1, 3) n
      union all select uid, sid, 'Forearm Plank', d0 - (i * 2 + 1), n, null::int, 50 - i * 2 - (n - 1) * 3, 7, true from generate_series(1, 3) n;
    else
      insert into public.workout_sets (user_id, session_id, exercise_name, session_date, set_number, reps, seconds, rpe, is_demo)
      select uid, sid, 'Decline Push-ups', d0 - (i * 2 + 1), n, base - 3 - (n - 1), null::int, 7.5, true from generate_series(1, 3) n
      union all select uid, sid, 'Bulgarian Split Squats', d0 - (i * 2 + 1), n, 10 - i / 2 - (n - 1), null::int, 7, true from generate_series(1, 3) n
      union all select uid, sid, 'Hollow Body Hold', d0 - (i * 2 + 1), n, null::int, 30 - i - (n - 1) * 2, 7, true from generate_series(1, 3) n;
    end if;
  end loop;

  insert into public.expenses (user_id, spent_on, amount, category, description, payment_method, is_demo)
  select uid, d0 - o, a, c, d, p, true from (values
    (0, 420.00, 'Food', 'Lunch and coffee', 'UPI'), (1, 180.00, 'Transport', 'Metro recharge', 'UPI'),
    (2, 1299.00, 'Shopping', 'Running shoes', 'Credit card'), (3, 349.00, 'Subscriptions', 'Cloud storage', 'Credit card'),
    (4, 260.00, 'Food', 'Dinner', 'UPI'), (5, 2150.00, 'Bills', 'Electricity bill', 'Net banking'),
    (6, 499.00, 'Education', 'CAN bus course', 'UPI'), (8, 320.00, 'Food', 'Groceries', 'Cash'),
    (9, 150.00, 'Transport', 'Auto fare', 'Cash'), (11, 899.00, 'Fitness', 'Resistance bands', 'UPI'),
    (13, 540.00, 'Entertainment', 'Movie night', 'UPI'), (15, 1200.00, 'Bills', 'Internet', 'Net banking'),
    (18, 275.00, 'Food', 'Lunch with team', 'UPI'), (22, 640.00, 'Health', 'Pharmacy', 'UPI'),
    (26, 410.00, 'Food', 'Weekend brunch', 'UPI')
  ) as v(o, a, c, d, p);

  for r in select * from (values
    (-6, 'posted', 'Automotive Cybersecurity Basics', 'Your car has over 100 ECUs. Who protects them?', 'Instagram', 4200, 310, 24, 41, 96, 18),
    (-4, 'posted', 'What is TARA in 60 seconds?', 'Before you protect a car, you must know what can go wrong', 'Instagram', 2900, 210, 17, 22, 64, 11),
    (-2, 'posted', 'ISO/SAE 21434 explained', 'The standard behind every secure vehicle', 'LinkedIn', 1800, 150, 12, 31, 40, 9),
    (0, 'ready', 'What is CAN Bus?', 'The network that lets your car talk to itself', 'Instagram', -1, 0, 0, 0, 0, 0),
    (2, 'scripted', 'UDS Explained', 'How a diagnostic tester asks an ECU for help', 'Instagram', -1, 0, 0, 0, 0, 0),
    (4, 'idea', 'Why CSMS matters for OEMs', 'Compliance is not optional anymore', 'YouTube', -1, 0, 0, 0, 0, 0)
  ) as v(off, st, idea, hook, plat, views, likes, comments, shares, saves, followers) loop
    insert into public.content_items (user_id, idea, hook, platform, status, planned_date, published_date, is_demo)
      values (uid, r.idea, r.hook, r.plat, r.st, d0 + r.off, case when r.st = 'posted' then d0 + r.off end, true) returning id into cid;
    if r.views >= 0 then
      insert into public.content_metrics (user_id, content_item_id, source, views, likes, comments, shares, saves, followers_gained)
        values (uid, cid, 'manual', r.views, r.likes, r.comments, r.shares, r.saves, r.followers);
    end if;
  end loop;

  insert into public.calendar_events (user_id, title, category, event_date, start_time, end_time, is_demo) values
    (uid, 'Team sync', 'work', d0, '10:00', '10:30', true),
    (uid, 'Evening study block', 'learning', d0 + 1, '19:00', '20:00', true),
    (uid, 'Family dinner', 'personal', d0 + 2, '20:00', null, true);

  insert into public.daily_checkins (user_id, checkin_date, workout_done, learning_done, content_done, expenses_logged, energy, productivity, accomplished, improve, is_demo)
  select uid, d0 - n, n % 2 = 1, true, n % 3 <> 0, true, 3 + (n % 3), 4 - (n % 2), 'Finished the planned study block', 'Sleep earlier', true
  from generate_series(1, 5) n on conflict (user_id, checkin_date) do nothing;
end $$;
revoke all on function public._seed_demo(uuid) from public, anon, authenticated;

create or replace function public.load_demo_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.expenses where user_id = auth.uid() and is_demo) then return; end if;
  perform public._seed_demo(auth.uid());
end $$;

create or replace function public.clear_demo_data() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.content_items where user_id = uid and is_demo;          -- metrics cascade
  delete from public.workout_sessions where user_id = uid and is_demo;       -- sets cascade
  delete from public.learning_sessions where user_id = uid and is_demo;
  delete from public.revision_items where user_id = uid and is_demo;
  delete from public.expenses where user_id = uid and is_demo;
  delete from public.calendar_events where user_id = uid and is_demo;
  delete from public.daily_checkins where user_id = uid and is_demo;
end $$;
revoke all on function public.load_demo_data(), public.clear_demo_data() from public, anon;
grant execute on function public.load_demo_data(), public.clear_demo_data() to authenticated;
