-- Keep this publication allowlist aligned with catalog/model/visual.ts.
-- A new generator ships with source and a new migration; existing keys stay reproducible.
alter table public.visual_assets add constraint supported_published_generator
  check (not published or kind <> 'procedural' or generator_key in ('atlas-bike-v1', 'atlas-bike-v2'));
