# Testing And QA Standards

## 1. Core Rule
Every code change must include tests, unless the change is documentation-only.

## 2. Test Pyramid Expectations
- Unit tests: business logic, formatters, validators, pure utilities.
- Integration tests: component behavior, route-level interactions, data/service integration points.
- End-to-end smoke tests: critical user flows (auth, car creation, entry logging, todo completion).

## 3. Minimum Tests By Change Type
- UI component change: interaction + rendering assertions, including error/empty states.
- Form change: validation tests (valid, invalid, edge cases) + submit behavior.
- Service/data change: success path, failure path, authorization/data-scope checks.
- Bug fix: regression test reproducing the original failure.

## 4. Test Stack Guidance
If not already configured in the touched area, establish a baseline stack:
- Unit/Integration: Vitest + Testing Library
- Network mocking: MSW (or equivalent)
- E2E smoke: Playwright

Add scripts to `package.json` when introducing test infrastructure:
- `test`
- `test:unit`
- `test:integration`
- `test:e2e` (when applicable)

## 5. Quality Gates
Run what applies:
- `npm run lint`
- `npx tsc --noEmit`
- relevant test command(s)
- `npm run build` for deployment-impacting changes

## 6. Mobile-First QA Matrix
At minimum validate on:
- 320x568 (small phone)
- 375x812 (common phone)
- 768x1024 (tablet portrait)
- 1024x768 (tablet/desktop boundary)
- >=1280 desktop

Validate:
- layout stability,
- touch target sizes,
- keyboard interaction,
- form usability with virtual keyboard,
- visible focus states and readable contrast.

## 7. Release Risk Checks
For each PR, explicitly state:
- what could break,
- where rollback is needed,
- whether data migration/security behavior changed.
