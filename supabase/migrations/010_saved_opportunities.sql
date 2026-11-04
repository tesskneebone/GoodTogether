-- Lets a volunteer bookmark an imported opportunity onto their own
-- calendar. Imported listings have no in-app signup (signing up happens
-- on the source site), so there's otherwise no record at all that a
-- volunteer intends to go -- this is a lightweight "add to my calendar"
-- note, separate from logged_activities (which is for hours actually
-- completed) and from signups (which only exist for native opportunities).
-- Run this in the Supabase SQL editor after 009_private_accounts.sql.

create table saved_opportunities (
  volunteer_id uuid not null references profiles (id) on delete cascade,
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (volunteer_id, opportunity_id)
);

create index saved_opportunities_volunteer_id_idx on saved_opportunities (volunteer_id);

alter table saved_opportunities enable row level security;

create policy "Volunteers can view their own saved opportunities"
  on saved_opportunities for select
  using (auth.uid() = volunteer_id);

create policy "Volunteers can save opportunities"
  on saved_opportunities for insert
  with check (auth.uid() = volunteer_id);

create policy "Volunteers can remove saved opportunities"
  on saved_opportunities for delete
  using (auth.uid() = volunteer_id);
