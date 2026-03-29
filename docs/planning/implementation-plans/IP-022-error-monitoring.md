# IP-022: Production Error Monitoring

## Metadata
- Task ID: T022
- Title: Production Error Monitoring
- Priority: P2
- Status: `draft`
- Related backlog item: T022

## 1. Problem Statement
No production error tracking exists. Unhandled errors and server action failures are invisible. `@vercel/analytics` is a dependency but needs verification it's properly wired.

## 2. Goals
- Unhandled errors reported to a monitoring service
- Server action failures tracked
- No PII leaked in error reports
- `@vercel/analytics` properly integrated

## 3. Non-Goals
- APM or distributed tracing
- Custom dashboards
- Alerting/paging setup

## 4. Scope
### In Scope
- Choose and integrate error monitoring (Sentry recommended)
- Wire `@vercel/analytics` (already a dependency)
- Add error boundaries for graceful UI failure handling
- Ensure no PII in error payloads

### Out Of Scope
- Performance monitoring
- Log aggregation
- Custom alert rules

## 5. Implementation Steps
1. Choose monitoring service (Sentry or Vercel Error Tracking)
2. Install SDK and configure for Next.js App Router
3. Add global error boundary
4. Verify `@vercel/analytics` is wired in root layout
5. Test error reporting with intentional error
6. Audit error payloads for PII

## 6. Acceptance Criteria
- [ ] Unhandled errors reported to monitoring service
- [ ] Server-side errors captured
- [ ] `@vercel/analytics` active in production
- [ ] No PII in error reports
- [ ] Error boundary provides graceful fallback UI
