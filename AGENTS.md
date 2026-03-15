# Carnitis Agent Operating Guide

This file defines how coding agents should plan and execute work in this repository.

## 1. Mission
Build and maintain a production-grade vehicle expense and maintenance app using Next.js + Supabase with a consistent focus on:
- correctness and robustness,
- clear and maintainable code,
- mandatory testing with every code change,
- mobile-first, intuitive UX that scales cleanly to tablet and desktop.

## 2. Project Context
- Frontend: Next.js App Router + TypeScript + React + Tailwind.
- Backend: Supabase (Postgres/Auth/Storage/Realtime).
- Current state: mock-first service layer exists in `lib/db` and `lib/auth`; migration to Supabase should preserve contracts while replacing adapters.

## 3. Source Of Truth Files
Always read these first before implementation:
- `docs/planning/TASK_BACKLOG.md`
- the relevant plan in `docs/planning/implementation-plans/`
- `docs/agents/README.md`

Then use the focused guidance:
- Architecture boundaries: `docs/agents/ARCHITECTURE.md`
- Engineering standards: `docs/agents/ENGINEERING_STANDARDS.md`
- Testing and QA: `docs/agents/TESTING_AND_QA.md`
- UX standards: `docs/agents/UI_UX_STANDARDS.md`
- Git workflow: `docs/agents/GIT_AND_DELIVERY.md`

## 4. Non-Negotiable Rules
1. No feature or refactor ships without tests appropriate to the change.
2. Mobile-first is mandatory for UI work; desktop is an enhancement layer, not the baseline.
3. Do not bypass domain/service boundaries just for short-term speed.
4. Validate all external input at boundaries (forms, API handlers, server actions).
5. Keep PRs small and atomic; each PR should be easy to review and rollback.
6. Never commit secrets. Use environment variables and documented contracts.
7. Any schema/auth/security change must include a rollback plan.

## 5. Standard Agent Workflow
1. Clarify scope and constraints from the user request.
2. Locate or create an implementation plan using the template in `docs/agents/templates/IMPLEMENTATION_PLAN_TEMPLATE.md`.
3. Identify affected layers (UI, domain, data, auth, DB schema, infra).
4. Implement in small, reviewable commits while preserving existing behavior unless requirements explicitly change.
5. Add or update tests before finalizing.
6. Run quality gates locally.
7. Provide a concise change summary, risk notes, and manual QA steps.

## 6. Required Quality Gates Before Completion
Run what applies for each change:
- `npm run lint`
- `npx tsc --noEmit`
- project test command(s) per `docs/agents/TESTING_AND_QA.md`
- `npm run build` for routing, SSR, env, or deployment-sensitive changes

If a required test setup is missing, add it as part of the change (or in an explicit prerequisite PR) before marking work complete.

## 7. Definition Of Done
A task is done only when:
- acceptance criteria are met,
- tests are added/updated and passing,
- responsive behavior is verified on phone, tablet, and desktop breakpoints,
- accessibility basics are validated (keyboard, labels, focus, contrast),
- docs/plans/backlog are updated where relevant,
- risks and follow-ups are explicitly documented.

Use `docs/agents/checklists/DEFINITION_OF_DONE.md` before final handoff.

## 8. Planning And Delivery Templates
- Implementation plan template: `docs/agents/templates/IMPLEMENTATION_PLAN_TEMPLATE.md`
- PR checklist template: `docs/agents/templates/PR_CHECKLIST_TEMPLATE.md`

## 9. Priority Order For Decision Tradeoffs
When tradeoffs are unavoidable, optimize in this order:
1. Data correctness and security
2. User-critical reliability
3. Simplicity and maintainability
4. Performance and polish
5. Delivery speed

## 10. Anti-Patterns To Avoid
- Mixing data fetching, business logic, and presentation in one large client component.
- Shipping untyped payloads between layers.
- Writing one-off SQL or auth logic without migration/versioning and tests.
- Styling desktop-first and patching mobile later.
- Merging broad changes without an explicit test strategy.

## 11. Expected Communication In PR/Task Updates
Include:
- what changed,
- why this approach was chosen,
- what was tested and how,
- known risks/limits,
- follow-up tasks if needed.
