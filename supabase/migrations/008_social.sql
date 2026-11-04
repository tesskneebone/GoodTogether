-- Adds usernames, activity photos, comments, and a follow graph.
-- Run this in the Supabase SQL editor after 007_activity_feed.sql.

-- ---------------------------------------------------------------------
-- Usernames
-- ---------------------------------------------------------------------

alter table profiles add column username text;

-- Shared by the backfill below and by handle_new_user() for everyone who
-- signs up from now on, so there's one place that defines how a default
-- username is derived from a display name.
create or replace function generate_unique_username(p_full_name text, p_id uuid)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(p_full_name, ''), '[^a-zA-Z0-9]+', '', 'g'));
  base := left(base, 16);
  if length(base) < 3 then
    base := 'user' || left(replace(p_id::text, '-', ''), 8);
  end if;

  candidate := base;
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := left(base, 16) || n::text;
  end loop;

  return candidate;
end;
$$;

-- Backfill row by row (not a single bulk UPDATE) so each new username is
-- visible to the uniqueness check for the rows after it.
do $$
declare
  r record;
begin
  for r in select id, full_name from profiles where username is null loop
    update profiles set username = generate_unique_username(full_name, id) where id = r.id;
  end loop;
end $$;

alter table profiles alter column username set not null;
alter table profiles add constraint profiles_username_key unique (username);
alter table profiles add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');
create index profiles_username_idx on profiles (username);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, org_name, username)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'volunteer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.raw_user_meta_data ->> 'org_name',
    generate_unique_username(coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'), new.id)
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Photos on logged activities
-- ---------------------------------------------------------------------

alter table logged_activities add column photo_url text;

insert into storage.buckets (id, name, public)
values ('activity-photos', 'activity-photos', true)
on conflict (id) do nothing;

create policy "Activity photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'activity-photos');

create policy "Users can upload their own activity photos"
  on storage.objects for insert
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own activity photos"
  on storage.objects for delete
  using (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Comments (on either a completed signup or a logged activity -- same
-- 'signup:<id>' / 'manual:<id>' synthetic key the feed and kudos use)
-- ---------------------------------------------------------------------

create table activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_key text not null,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 500),
  created_at timestamptz not null default now()
);

create index activity_comments_activity_key_idx on activity_comments (activity_key);

alter table activity_comments enable row level security;

create policy "Comments are publicly readable"
  on activity_comments for select
  using (true);

create policy "Authenticated users can comment"
  on activity_comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on activity_comments for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------

create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  following_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_follower_id_idx on follows (follower_id);
create index follows_following_id_idx on follows (following_id);

alter table follows enable row level security;

create policy "Follows are publicly readable"
  on follows for select
  using (true);

create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);
