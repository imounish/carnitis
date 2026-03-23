# Engineering Standards

## 1. Code Quality Principles
- Favor simple, explicit code over clever abstractions.
- Keep functions small and single-purpose.
- Use meaningful names and strict typing.
- Avoid `any`; if unavoidable, isolate and document it.

## 2. TypeScript And Validation
- Define shared domain types in a clear boundary module.
- Validate external input with `zod` at boundaries.
- Route-level parsing is not a substitute for repository/domain validation. Public service seams still need canonical validation even when a route already normalized the payload.
- Do not trust client payloads or URL params without parsing.
- Model nullable/optional states explicitly.

## 3. Next.js Conventions
- Default to Server Components.
- Use `"use client"` only where required.
- Keep data fetching close to server boundaries.
- For mutations, enforce auth + validation before state changes.
- Keep route helper modules framework-agnostic where possible so Node-based tests can cover payload parsing and user-safe error serialization without pulling in `NextResponse`.

## 4. Supabase Conventions
- Prefer parameterized/query-builder APIs.
- Enforce user scoping in SQL/RLS and in application checks.
- Avoid ad-hoc access patterns that bypass shared data utilities.
- Every migration must be reversible or have a documented rollback plan.
- With Better Auth, do not build ownership policies around `auth.uid()`. Use app-owned user ids and a server-set transaction context instead.
- For user-owned child tables, prefer redundant `owner_user_id` columns plus composite `(id, owner_user_id)` references so cross-table ownership can be enforced in the database.
- Exception: if a relationship is intentionally detachable with `on delete set null`, do not include non-null ownership columns in that nullable FK. Keep the referential link on the nullable id column and enforce same-user/same-car checks in the transaction workflow.

## 4A. Transaction Boundaries
- Cross-entity write flows belong behind one server-owned transaction boundary in the repository/data-access layer, not in client components or route handlers.
- Route handlers should authenticate, parse, and hand off; they should not duplicate multi-table business logic that already exists in the repository seam.
- If the UI filters selectable linked rows by status, mirror that eligibility rule inside the transaction workflow so crafted requests cannot bypass the intended state machine.
- Derived business state such as maintenance due status should be recomputed server-side from canonical inputs on reads and writes. Do not expose it as a free-form client-controlled field just because the table stores it.

## 4B. Temporal Logic Standards
- Do not use `new Date("YYYY-MM-DD")` for business-date parsing. Parse date-only values into local calendar dates explicitly.
- Do not use `toISOString().split("T")[0]` to synthesize business dates.
- Do not rely on `setMonth()` overflow semantics for due-date scheduling; clamp end-of-month behavior deliberately.
- Keep pure temporal helpers in a shared seam so both mock and Supabase paths use the same date logic.
- For client component tests, keep router, toast, and network calls mockable at the boundary instead of burying them in opaque side-effect helpers.
- Normalize DB row values to domain semantics in the mapper layer. If a domain helper expects `YYYY-MM-DD` strings, do not let raw `Date` instances from the driver leak past the mapper boundary.

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
- When pure request-parsing or workflow helper logic can be isolated, keep it framework-agnostic so the Node test runner can exercise it without booting Next.js.
