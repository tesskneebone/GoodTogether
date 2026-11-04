-- Lets an account be set to private: visible only to the account owner --
-- not on their public profile page, in the activity feed, or on the
-- leaderboard. (Following still works the same either way; it doesn't
-- grant extra visibility into a private account -- there's no
-- follow-request/approval step here, just a visibility switch.)
-- Run this in the Supabase SQL editor after 008_social.sql.

alter table profiles add column is_private boolean not null default false;

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
