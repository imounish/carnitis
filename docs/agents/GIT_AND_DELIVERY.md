# Git And Delivery Standards

## 1. Branching
- One task per branch.
- Branch naming: `feature/<task-id>-<slug>`, `fix/<task-id>-<slug>`, `chore/<slug>`.
- Keep branch scope tight; avoid mixing unrelated work.

## 2. Commit Strategy
- Small, atomic commits with clear intent.
- Recommended commit format:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `refactor(scope): ...`
  - `test(scope): ...`
  - `docs(scope): ...`
- If a task is intentionally planned as stacked subtasks but implemented on one branch, preserve the subtask boundaries as separate commits so review and rollback stay targeted.

## 3. PR Standards
Each PR should include:
- problem statement,
- implementation summary,
- testing evidence,
- responsive/a11y verification notes,
- risk + rollback notes.

Use: `docs/agents/templates/PR_CHECKLIST_TEMPLATE.md`

## 4. Review Discipline
- Prioritize behavior correctness, security, and data integrity.
- Flag breaking changes explicitly.
- Reject PRs that skip tests or responsive verification.

## 5. Rollback Readiness
For changes that affect schema/auth/critical flows, include:
- rollback steps,
- migration reversal strategy,
- data impact notes.

## 6. Merge Readiness Gate
Do not merge until:
- quality gates pass,
- tests pass,
- required docs/plans/checklists are updated,
- reviewer questions are resolved.
