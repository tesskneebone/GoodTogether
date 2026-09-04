-- GoodTogether database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create type user_role as enum ('volunteer', 'org');

create type opportunity_category as enum (
  'environment',
  'education',
  'food_security',
  'homelessness',
  'animal_welfare',
  'health',
  'seniors',
  'youth',
  'disaster_relief',
  'arts_culture',
  'other'
);

create type signup_status as enum ('confirmed', 'cancelled');

-- One row per auth.users user, created on signup via trigger below.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  org_name text,
  bio text,
  created_at timestamptz not null default now()
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category opportunity_category not null,
  neighborhood text not null,
  address text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  spots_total int not null check (spots_total > 0),
  spots_filled int not null default 0 check (spots_filled >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  constraint spots_filled_lte_total check (spots_filled <= spots_total),
  constraint ends_after_starts check (ends_at > starts_at)
);

create table signups (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  volunteer_id uuid not null references profiles (id) on delete cascade,
  status signup_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (opportunity_id, volunteer_id)
);

create index opportunities_starts_at_idx on opportunities (starts_at);
create index opportunities_category_idx on opportunities (category);
create index opportunities_neighborhood_idx on opportunities (neighborhood);
create index signups_volunteer_id_idx on signups (volunteer_id);
create index signups_opportunity_id_idx on signups (opportunity_id);

-- Keep spots_filled in sync with confirmed signups.
create or replace function handle_signup_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' and new.status = 'confirmed') then
    update opportunities set spots_filled = spots_filled + 1 where id = new.opportunity_id;
  elsif (tg_op = 'DELETE' and old.status = 'confirmed') then
    update opportunities set spots_filled = greatest(spots_filled - 1, 0) where id = old.opportunity_id;
  elsif (tg_op = 'UPDATE' and old.status <> new.status) then
    if new.status = 'confirmed' then
      update opportunities set spots_filled = spots_filled + 1 where id = new.opportunity_id;
    elsif old.status = 'confirmed' then
      update opportunities set spots_filled = greatest(spots_filled - 1, 0) where id = new.opportunity_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger on_signup_change
after insert or update or delete on signups
for each row execute function handle_signup_change();

-- Auto-create a profile row when a new auth user is created.
-- Expects role/full_name/org_name to be passed in via signUp() options.data.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, org_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'volunteer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.raw_user_meta_data ->> 'org_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table opportunities enable row level security;
alter table signups enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Opportunities are publicly readable"
  on opportunities for select
  using (true);

create policy "Orgs can create their own opportunities"
  on opportunities for insert
  with check (
    auth.uid() = org_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'org')
  );

create policy "Orgs can update their own opportunities"
  on opportunities for update
  using (auth.uid() = org_id);

create policy "Orgs can delete their own opportunities"
  on opportunities for delete
  using (auth.uid() = org_id);

create policy "Volunteers can view relevant signups"
  on signups for select
  using (
    auth.uid() = volunteer_id
    or auth.uid() in (select org_id from opportunities where id = opportunity_id)
  );

create policy "Volunteers can sign up for opportunities"
  on signups for insert
  with check (
    auth.uid() = volunteer_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'volunteer')
  );

create policy "Volunteers can cancel their own signup"
  on signups for update
  using (auth.uid() = volunteer_id);

create policy "Volunteers can delete their own signup"
  on signups for delete
  using (auth.uid() = volunteer_id);
