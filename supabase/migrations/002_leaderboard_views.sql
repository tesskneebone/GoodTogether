-- Adds public leaderboard views aggregating volunteer hours.
-- Run this in the Supabase SQL editor after supabase/schema.sql.
--
-- Hours are only counted for confirmed signups on opportunities that have
-- already ended (ends_at < now()) -- i.e. hours actually volunteered, not
-- hours merely signed up for. Views expose only aggregated totals (name +
-- hours), never individual signup rows, so they're safe to grant broadly
-- even though the underlying `signups` table is RLS-restricted per user.

create or replace view volunteer_hours_alltime as
select
  p.id as volunteer_id,
  p.full_name,
  round(coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0, 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id and o.ends_at < now()
where p.role = 'volunteer'
group by p.id, p.full_name;

create or replace view volunteer_hours_weekly as
select
  p.id as volunteer_id,
  p.full_name,
  round(coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0, 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id
  and o.ends_at < now()
  and o.starts_at >= date_trunc('week', now())
where p.role = 'volunteer'
group by p.id, p.full_name;

grant select on volunteer_hours_alltime to anon, authenticated;
grant select on volunteer_hours_weekly to anon, authenticated;
