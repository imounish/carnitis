-- Better Auth tables live in the public schema, which Supabase exposes through the REST API.
-- Without RLS, the publishable (anon) key can read and write them. The app reaches them only
-- through the server-side Postgres connection (postgres role, bypasses RLS), so deny all API roles.
alter table if exists public."user" enable row level security;
alter table if exists public."session" enable row level security;
alter table if exists public."account" enable row level security;
alter table if exists public."verification" enable row level security;

revoke all on table public."user" from anon, authenticated;
revoke all on table public."session" from anon, authenticated;
revoke all on table public."account" from anon, authenticated;
revoke all on table public."verification" from anon, authenticated;

-- Rollback (do not run unless reverting T017 follow-up):
--   alter table public."user" disable row level security; (repeat per table)
--   grant all on table public."user" to anon, authenticated; (repeat per table)
