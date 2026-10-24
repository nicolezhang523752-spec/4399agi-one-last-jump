-- Run after profiles.sql in the Supabase SQL Editor.
-- One row is one completed run. Completion time is measured in milliseconds.
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 1000000000),
  level_reached integer not null check (level_reached between 1 and 3),
  completion_time integer check (completion_time between 0 and 86400000),
  attempts integer check (attempts between 1 and 1000000),
  created_at timestamptz not null default now(),
  unique (user_id, run_id)
);

create index if not exists scores_user_recent_idx
  on public.scores (user_id, created_at desc);
create index if not exists scores_ranking_idx
  on public.scores (score desc, level_reached desc, completion_time asc nulls last, created_at asc);

alter table public.scores enable row level security;

drop policy if exists "Users can insert own scores" on public.scores;
create policy "Users can insert own scores" on public.scores
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own scores" on public.scores;
create policy "Users can read own scores" on public.scores
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.scores from anon, authenticated;
grant select on public.scores to authenticated;
grant insert (run_id, user_id, score, level_reached, completion_time, attempts)
  on public.scores to authenticated;

-- Deliberately public, narrow projection: one best run per player, with no email,
-- authentication metadata, or private score history. The owner of this view reads
-- profiles and scores through their RLS policies; callers can only read the view's
-- explicitly selected columns. Keep the view owner privileged (SQL Editor/postgres).
create or replace view public.leaderboard_view
with (security_barrier = true)
as
with best as (
  select distinct on (s.user_id)
    s.user_id, s.score, s.level_reached, s.completion_time, s.created_at, s.id
  from public.scores as s
  order by s.user_id, s.score desc, s.level_reached desc,
    s.completion_time asc nulls last, s.created_at asc, s.id asc
)
select
  row_number() over (
    order by b.score desc, b.level_reached desc,
      b.completion_time asc nulls last, b.created_at asc, b.id asc
  )::bigint as rank,
  b.user_id, p.username, b.score, b.level_reached,
  b.completion_time, b.created_at
from best as b
join public.profiles as p on p.id = b.user_id;

revoke all on public.leaderboard_view from public, anon, authenticated;
grant select on public.leaderboard_view to anon, authenticated;
