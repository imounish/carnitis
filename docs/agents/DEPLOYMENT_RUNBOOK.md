# Deployment Runbook (Vercel + Supabase)

## Required environment variables (Vercel: Production + Preview)
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API keys (publishable) |
| `SUPABASE_SECRET_KEY` | Supabase → API keys (secret) |
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (port 6543); serverless needs the pooler, not the direct host |
| `BETTER_AUTH_URL` | Public production URL, e.g. `https://<app>.vercel.app` (no trailing slash) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 48` (min 32 chars); never reuse the local value |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional; add `<BETTER_AUTH_URL>/api/auth/callback/google` as an authorized redirect URI |

## Steps
1. Apply migrations to the production database: `npx supabase link --project-ref <ref>` then `npx supabase db push` (review the dry run first: `--dry-run`).
2. Add env vars: `vercel env add <NAME> production` for each variable above.
3. Merge `dev` into `main` and push; Vercel deploys the production branch.
4. Verify: `/sign-up`, `/sign-in`, Google OAuth, create a car, an entry, a maintenance item and a todo; confirm real data on the dashboard.
5. Check response headers (`curl -I <url>`) and the browser console for CSP report-only violations before enforcing the CSP.

## Rollback
- App: Vercel → Deployments → promote the previous deployment.
- Database: migrations are additive; restore from a Supabase backup if a migration must be undone.
