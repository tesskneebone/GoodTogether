-- Fixes a bug in prevent_profile_privilege_escalation() (from
-- 014_org_approval.sql): it silently reverted is_admin/org_status/role
-- changes made directly from the Supabase SQL editor, because auth.uid()
-- is null there (there's no logged-in request), which the old trigger
-- misread as "a non-admin is trying to self-promote" and blocked.
--
-- A null auth.uid() only happens for a direct/superuser SQL editor
-- connection, or an unauthenticated request -- and an unauthenticated
-- request can never reach this trigger anyway, since the table's RLS
-- UPDATE policies both require auth.uid() to match a real row (either
-- the caller's own id, or an admin's id), which NULL never satisfies.
-- So it's safe to skip the guard entirely when auth.uid() is null.
--
-- Run this in the Supabase SQL editor after 014_org_approval.sql.

create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  if auth.uid() is not null then
    select is_admin into caller_is_admin from profiles where id = auth.uid();
    if not coalesce(caller_is_admin, false) then
      new.is_admin := old.is_admin;
      new.org_status := old.org_status;
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;
