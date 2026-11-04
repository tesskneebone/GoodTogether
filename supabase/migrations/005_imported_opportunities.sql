-- Adds support for opportunities imported from external sources (RSS
-- feeds, scraped nonprofit sites) alongside the existing org-posted ones.
-- Run after 002/003/004.

-- Imported opportunities have no org on this platform, so org_id must
-- become nullable. A check constraint ensures every row is still either
-- a native listing (org_id set) or an imported one (source set).
alter table opportunities
  alter column org_id drop not null;

alter table opportunities
  add column if not exists source text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists external_id text,
  add column if not exists image_credit text,
  add column if not exists image_credit_url text;

alter table opportunities
  add constraint opportunities_native_or_imported
  check (org_id is not null or source is not null);

-- Dedup key so re-running an import updates existing rows instead of
-- creating duplicates. Only meaningful when source is set.
create unique index if not exists opportunities_source_external_id_idx
  on opportunities (source, external_id)
  where source is not null;

create index if not exists opportunities_source_idx
  on opportunities (source)
  where source is not null;
