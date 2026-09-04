-- Adds avatar_url to the leaderboard views so the leaderboard can show
-- volunteer photos. Run after 002_leaderboard_views.sql and
-- 003_profile_extras.sql.

create or replace view volunteer_hours_alltime as
select
  p.id as volunteer_id,
  p.full_name,
  p.avatar_url,
  round(coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0, 1) as total_hours
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
  round(coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0, 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id
  and o.ends_at < now()
  and o.starts_at >= date_trunc('week', now())
where p.role = 'volunteer'
group by p.id, p.full_name, p.avatar_url;

grant select on volunteer_hours_alltime to anon, authenticated;
grant select on volunteer_hours_weekly to anon, authenticated;
