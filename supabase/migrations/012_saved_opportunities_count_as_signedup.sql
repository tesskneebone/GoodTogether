-- Saving an imported opportunity now represents "I signed up for this"
-- (on the source site) rather than just "I'm interested" -- once the
-- opportunity's end time passes, it counts toward hours/badges/leaderboard
-- the same way a native signup or a logged activity does.
-- Run this in the Supabase SQL editor after 011_edit_logged_activities.sql.

create or replace view volunteer_hours_alltime as
select
  p.id as volunteer_id,
  p.full_name,
  p.avatar_url,
  round(
    coalesce(sum(extract(epoch from (o.ends_at - o.starts_at))), 0) / 3600.0
    + coalesce((select sum(la.hours) from logged_activities la where la.volunteer_id = p.id), 0)
    + coalesce((
        select sum(extract(epoch from (so_opp.ends_at - so_opp.starts_at))) / 3600.0
        from saved_opportunities so
        join opportunities so_opp on so_opp.id = so.opportunity_id
        where so.volunteer_id = p.id and so_opp.ends_at < now()
      ), 0)
  , 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id and o.ends_at < now()
where p.role = 'volunteer' and not p.is_private
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
    + coalesce((
        select sum(extract(epoch from (so_opp.ends_at - so_opp.starts_at))) / 3600.0
        from saved_opportunities so
        join opportunities so_opp on so_opp.id = so.opportunity_id
        where so.volunteer_id = p.id
          and so_opp.ends_at < now()
          and so_opp.starts_at >= date_trunc('week', now())
      ), 0)
  , 1) as total_hours
from profiles p
left join signups s
  on s.volunteer_id = p.id and s.status = 'confirmed'
left join opportunities o
  on o.id = s.opportunity_id
  and o.ends_at < now()
  and o.starts_at >= date_trunc('week', now())
where p.role = 'volunteer' and not p.is_private
group by p.id, p.full_name, p.avatar_url;
