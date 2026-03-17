# Local Supabase Workflow

Use this workflow for the local Docker-based Supabase setup that backs `T003` and the Better Auth integration.

## Environment
- Copy the contract from [.env.example](/Users/mounish/workspace/projects/car-expense/carnitis/.env.example) into `.env.local`.
- Required values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `DATABASE_URL`
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
- For local Better Auth, keep `BETTER_AUTH_URL` aligned with the browser origin you actually use. If Google OAuth is registered with `http://localhost:3000/api/auth/callback/google`, then `BETTER_AUTH_URL` must also use `http://localhost:3000`.

## Start And Verify
1. Start local Supabase with `npx supabase start`.
2. Apply Better Auth tables with `npm run auth:migrate`.
3. Apply repo SQL migrations with `npx supabase db reset` or `npx supabase migration up` once migration history is in use.
4. Verify the auth surface with `GET /api/auth/ok`.

## Common Commands
- `npm run supabase:status`
- `npm run supabase:reset`
- `npm run auth:migrate`

## Current Schema Notes
- Better Auth auth tables live in the same Postgres instance as the app data.
- App-owned auth profile state lives in `public.user_profiles`.
- Local seed behavior currently uses [supabase/seed.sql](/Users/mounish/workspace/projects/car-expense/carnitis/supabase/seed.sql); domain seed data remains tracked under `T018`.
