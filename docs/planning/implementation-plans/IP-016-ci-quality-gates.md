# IP-016: CI Quality Gates

## Metadata
- Task ID: T016
- Title: CI Quality Gates (typecheck, lint, test, build via GitHub Actions)
- Priority: P1
- Status: `done`
- Related backlog item: T016

## 1. Problem Statement
No CI/CD pipeline exists. No `.github/` directory. Code merges have no automated quality checks. Requires T017 (remove `ignoreBuildErrors`) to be meaningful.

## 2. Goals
- GitHub Actions pipeline runs on every PR
- Typecheck, lint, test, and build must all pass before merge
- Fast feedback loop for contributors

## 3. Scope
### In Scope
- GitHub Actions workflow configuration
- Jobs: `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build`
- Branch protection rules on main

### Out Of Scope
- Deployment automation (Vercel handles this)
- Database integration tests in CI (local Supabase not available in CI)
- Performance budgets

## 4. Acceptance Criteria
- [x] GitHub Actions workflow runs on PR to main
- [x] TypeScript check passes
- [x] Lint passes
- [x] Tests pass
- [x] Build passes
- [x] Branch protection configured on main
