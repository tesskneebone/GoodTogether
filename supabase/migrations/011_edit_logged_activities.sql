-- Adds a location field to logged activities and lets volunteers edit
-- (not just create/delete) their own logged activities -- e.g. to add a
-- photo or location after the fact.
-- Run this in the Supabase SQL editor after 010_saved_opportunities.sql.

alter table logged_activities add column location text;

create policy "Volunteers can update their own logged activities"
  on logged_activities for update
  using (auth.uid() = volunteer_id)
  with check (auth.uid() = volunteer_id);
