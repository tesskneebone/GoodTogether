-- Lets a volunteer hide their age and/or bio from their public profile
-- (/u/[username]) while still keeping them filled in for their own editing
-- and for orgs reviewing sign-ups internally.
--
-- Run this in the Supabase SQL editor after 017_editable_signups_and_saved.sql.

alter table profiles add column hide_age boolean not null default false;
alter table profiles add column hide_bio boolean not null default false;
