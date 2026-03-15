# Definition Of Done Checklist

Use before closing a task or opening a merge-ready PR.

## Correctness
- [ ] Acceptance criteria are fully met.
- [ ] Edge cases and failure paths are handled.
- [ ] No regressions introduced in adjacent flows.

## Testing
- [ ] Tests were added/updated for all code changes.
- [ ] Regression tests exist for bug fixes.
- [ ] Relevant test suites pass locally.

## Quality Gates
- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] Build/test commands required by the task pass.

## UX And Accessibility
- [ ] Mobile-first behavior verified.
- [ ] Tablet and desktop behavior verified.
- [ ] Keyboard and focus behavior validated.
- [ ] Accessible labels/error states/contrast validated.

## Security And Data Safety
- [ ] No secrets committed.
- [ ] Auth and authorization checks are in place.
- [ ] Data access follows least privilege.

## Delivery
- [ ] Documentation/plans updated.
- [ ] PR notes include test evidence, risks, rollback.
- [ ] Follow-up work is tracked explicitly.
