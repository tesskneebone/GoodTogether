-- Fixes the imported-opportunity dedup key from 005. The partial unique
-- index there (`where source is not null`) can't be used as an ON
-- CONFLICT target by a plain upsert -- Postgres requires an exact match,
-- and PostgREST's upsert doesn't let you repeat the WHERE clause.
--
-- A plain (non-partial) unique constraint works instead: Postgres treats
-- NULL as distinct from NULL, so native opportunities (source and
-- external_id both null) are never considered duplicates of each other.

drop index if exists opportunities_source_external_id_idx;

alter table opportunities
  add constraint opportunities_source_external_id_key
  unique (source, external_id);
