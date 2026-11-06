-- Lets a volunteer add a photo/note and override the hours on a signup
-- or saved-opportunity feed entry, the same way they already can on a
-- manually logged activity -- e.g. the UCLA blood drive is an imported
-- listing (saved_opportunities, not logged_activities), and previously
-- had no way to attach a photo/note or correct the hours if the actual
-- visit ran shorter/longer than the posted window.
--
-- hours_override, when set, replaces the computed (ends_at - starts_at)
-- duration everywhere that duration is used: the feed, badge progress,
-- and the leaderboard.
--
-- Run this in the Supabase SQL editor after 016_hide_unapproved_org_opportunities.sql.

alter table signups add column note text;
alter table signups add column photo_url text;
alter table signups add column hours_override numeric
  check (hours_override is null or (hours_override > 0 and hours_override <= 24));

alter table saved_opportunities add column note text;
alter table saved_opportunities add column photo_url text;
alter table saved_opportunities add column hours_override numeric
  check (hours_override is null or (hours_override > 0 and hours_override <= 24));

-- signups already has an UPDATE policy ("Volunteers can cancel their own
-- signup") scoped to auth.uid() = volunteer_id with no column
-- restriction, so it already covers these new columns. saved_opportunities
-- has no UPDATE policy yet.
create policy "Volunteers can update their own saved opportunities"
  on saved_opportunities for update
  using (auth.uid() = volunteer_id)
  with check (auth.uid() = volunteer_id);
