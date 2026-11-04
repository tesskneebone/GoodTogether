-- Opportunities from a pending or rejected org were still publicly visible
-- everywhere (browse page, home page, etc.) -- the approval gate from
-- 014_org_approval.sql only ever blocked *posting new* ones; it never hid
-- ones from an org that was never approved, or got approved then later
-- revoked. This replaces the public SELECT policy so only imported
-- listings (org_id is null) and currently-approved orgs' opportunities are
-- publicly visible, while still letting an org see its own opportunities
-- on its own dashboard regardless of its current status.
--
-- Run this in the Supabase SQL editor after 015_fix_admin_trigger.sql.

drop policy "Opportunities are publicly readable" on opportunities;

create policy "Opportunities are publicly readable when org is approved"
  on opportunities for select
  using (
    org_id is null
    or exists (
      select 1 from profiles
      where id = opportunities.org_id and org_status = 'approved'
    )
  );

create policy "Orgs can view their own opportunities regardless of status"
  on opportunities for select
  using (auth.uid() = org_id);
