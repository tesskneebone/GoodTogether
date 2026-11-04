-- Adds a human-reviewed approval gate for organization accounts, so a new
-- org can't post opportunities until a GoodTogether admin verifies them.
-- Run this in the Supabase SQL editor after 013_comment_likes.sql.

create type org_status as enum ('pending', 'approved', 'rejected');

alter table profiles add column org_status org_status;
alter table profiles add column is_admin boolean not null default false;

-- Grandfather in orgs that already existed before this gate did, so nobody
-- currently posting opportunities gets locked out.
update profiles set org_status = 'approved' where role = 'org' and org_status is null;

-- New org signups start pending; volunteers have no org_status at all.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role user_role;
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'volunteer');
  insert into public.profiles (id, role, full_name, org_name, org_status)
  values (
    new.id,
    new_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.raw_user_meta_data ->> 'org_name',
    case when new_role = 'org' then 'pending' else null end
  );
  return new;
end;
$$;

-- Stop a non-admin from granting themselves is_admin, approving their own
-- org, or switching their own role, through a normal profile update.
-- Admins (checked here, not by the caller) can still change any of these.
create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  select is_admin into caller_is_admin from profiles where id = auth.uid();
  if not coalesce(caller_is_admin, false) then
    new.is_admin := old.is_admin;
    new.org_status := old.org_status;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger before_profile_update_guard
before update on profiles
for each row execute function prevent_profile_privilege_escalation();

-- Lets an admin update any profile (to approve/reject an org), not just their own.
create policy "Admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Only an approved org can post opportunities now.
drop policy "Orgs can create their own opportunities" on opportunities;

create policy "Approved orgs can create their own opportunities"
  on opportunities for insert
  with check (
    auth.uid() = org_id
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'org' and org_status = 'approved'
    )
  );

-- Lets an admin look up the signup email for a pending org, to verify it's
-- a real, accredited group, without exposing everyone's email broadly.
create or replace function get_org_contact_email(target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
  result text;
begin
  select is_admin into caller_is_admin from profiles where id = auth.uid();
  if not coalesce(caller_is_admin, false) then
    return null;
  end if;
  select email into result from auth.users where id = target_id;
  return result;
end;
$$;

grant execute on function get_org_contact_email(uuid) to authenticated;
