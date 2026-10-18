alter table public.entries
  add column if not exists fuel_level_before smallint
  check (fuel_level_before between 0 and 100);
