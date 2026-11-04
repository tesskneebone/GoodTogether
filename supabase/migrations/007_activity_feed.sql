-- Adds manually-logged activities (for things that don't go through an
-- in-app signup, like a blood drive or volunteering with an org that isn't
-- on the platform yet) and kudos, so hours/badges/leaderboard and a new
-- Strava-style activity feed both draw from the same data.
-- Run this in the Supabase SQL editor after the previous migrations.

create table logged_activities (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references profiles (id) on delete cascade,
  category opportunity_category not null,
  title text not null,
  org_name text,
  occurred_at date not null,
  hours numeric not null check (hours > 0 and hours <= 24),
  note text,
  created_at timestamptz not null default now(),
  -- Logging is self-reported, so it's capped to the recent past: no
  -- future-dating, and no reaching back more than a month.
  constraint logged_activities_recent check (
    occurred_at <= current_date and occurred_at >= current_date - interval '31 days'
  )
);

create index logged_activities_volunteer_id_idx on logged_activities (volunteer_id);
create index logged_activities_occurred_at_idx on logged_activities (occurred_at);

alter table logged_activities enable row level security;

create policy "Logged activities are publicly readable"
  on logged_activities for select
  using (true);

create policy "Volunteers can log their own activities"
  on logged_activities for insert
  with check (
    auth.uid() = volunteer_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'volunteer')
  );

create policy "Volunteers can delete their own logged activities"
  on logged_activities for delete
  using (auth.uid() = volunteer_id);

-- A feed "activity" is either a completed signup (key 'signup:<id>') or a
-- logged_activities row (key 'manual:<id>') -- a synthetic key keeps kudos
-- generic across both sources instead of needing two nullable FKs.
create table activity_kudos (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references profiles (id) on delete cascade,
  activity_key text not null,
  created_at timestamptz not null default now(),
  unique (giver_id, activity_key)
);

create index activity_kudos_activity_key_idx on activity_kudos (activity_key);

alter table activity_kudos enable row level security;

create policy "Kudos are publicly readable"
  on activity_kudos for select
  using (true);

create policy "Volunteers can give their own kudos"
  on activity_kudos for insert
  with check (auth.uid() = giver_id);

create policy "Volunteers can take back their own kudos"
  on activity_kudos for delete
  using (auth.uid() = giver_id);

-- Leaderboard views now add logged_activities hours on top of completed
-- signups. The subquery is scalar per profile row, so it isn't affected by
-- how many signup rows a volunteer has (no double counting).
create or replace view volunteer_hours_alltime as
select
  p.id as volunteer_id,
  p.full_name,
  p.avatar_url,
  round(
    coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0
    + coalesce((select sum(la.hours) from logged_activities la where la.volunteer_id = p.id), 0)
  , 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id and o.ends_at < now()
where p.role = 'volunteer'
group by p.id, p.full_name, p.avatar_url;

create or replace view volunteer_hours_weekly as
select
  p.id as volunteer_id,
  p.full_name,
  p.avatar_url,
  round(
    coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0
    + coalesce((
        select sum(la.hours) from logged_activities la
        where la.volunteer_id = p.id and la.occurred_at >= date_trunc('week', now())::date
      ), 0)
  , 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id
  and o.ends_at < now()
  and o.starts_at >= date_trunc('week', now())
where p.role = 'volunteer'
group by p.id, p.full_name, p.avatar_url;
