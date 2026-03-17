# Engineering Standards

## 1. Code Quality Principles
- Favor simple, explicit code over clever abstractions.
- Keep functions small and single-purpose.
- Use meaningful names and strict typing.
- Avoid `any`; if unavoidable, isolate and document it.

## 2. TypeScript And Validation
- Define shared domain types in a clear boundary module.
- Validate external input with `zod` at boundaries.
- Do not trust client payloads or URL params without parsing.
- Model nullable/optional states explicitly.

## 3. Next.js Conventions
- Default to Server Components.
- Use `"use client"` only where required.
- Keep data fetching close to server boundaries.
- For mutations, enforce auth + validation before state changes.

## 4. Supabase Conventions
- Prefer parameterized/query-builder APIs.
- Enforce user scoping in SQL/RLS and in application checks.
- Avoid ad-hoc access patterns that bypass shared data utilities.
- Every migration must be reversible or have a documented rollback plan.
- With Better Auth, do not build ownership policies around `auth.uid()`. Use app-owned user ids and a server-set transaction context instead.
- For user-owned child tables, prefer redundant `owner_user_id` columns plus composite `(id, owner_user_id)` references so cross-table ownership can be enforced in the database.

## 5. Error And State Handling
- Use typed result patterns for expected failures.
- Throw exceptions only for truly exceptional cases.
- Ensure loading, empty, success, and error states are all handled.

## 6. Logging And Observability
- Log operational failures with sufficient context for debugging.
- Never log credentials, access tokens, or PII-heavy payloads.
- Keep client-side error text actionable and non-technical.
- Prefer a shared logger/normalizer for data access so validation, Postgres constraint failures, and unexpected errors collapse into one consistent shape.

## 7. Security Baselines
- Treat all inputs as untrusted.
- Protect sensitive mutations behind auth checks.
- Keep privileged Supabase secret-key usage server-only.
- Minimize data returned to clients (principle of least data).

## 8. Review-Ready Standards
Before marking work complete:
- remove dead code and TODOs without issue links,
- ensure naming consistency with existing code,
- verify no unrelated refactors slipped into the diff,
- confirm documentation/tests updated for behavior changes.
