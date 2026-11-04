-- Lets any logged-in user like a comment on a feed item.
-- Run this in the Supabase SQL editor after 012_saved_opportunities_count_as_signedup.sql.

create table comment_likes (
  comment_id uuid not null references activity_comments (id) on delete cascade,
  liker_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, liker_id)
);

create index comment_likes_comment_id_idx on comment_likes (comment_id);

alter table comment_likes enable row level security;

create policy "Comment likes are publicly readable"
  on comment_likes for select
  using (true);

create policy "Users can like comments"
  on comment_likes for insert
  with check (auth.uid() = liker_id);

create policy "Users can unlike comments"
  on comment_likes for delete
  using (auth.uid() = liker_id);
