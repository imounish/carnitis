# IP-013A: Mobile-First Excellence Program

## Metadata
- Task ID: `T013A`
- Priority: `P0`
- Status: `implemented`
- Scope: Ensure the app is intentionally modeled for excellent usability on mobile screens first, while preserving desktop quality.

## Objectives
- Deliver fast, clear, thumb-friendly workflows for all primary tasks on phones.
- Reduce cognitive load and input friction in high-frequency flows (log entry, task completion, maintenance checks).
- Establish mobile UX standards that become mandatory for all future feature work.

## Non-Goals
- No redesign of entire visual identity in one pass.
- No platform-specific native app behavior.

## Principles
1. Mobile-first layout decisions before desktop enhancements.
2. Single-primary-action per screen on small devices.
3. Large touch targets and low-precision friendly controls.
4. Progressive disclosure for advanced form fields.
5. Accessible interactions for touch, keyboard, and assistive technologies.

## Step-by-Step Plan

### Step 1: Define hard mobile UX constraints
- Minimum touch target: 44x44 px.
- Bottom-nav and fixed actions respect safe-area insets.
- Inputs and critical actions stay above virtual keyboard when focused.
- Content width and spacing tuned for 320-430 px viewport range.

### Step 2: Audit all routes for mobile critical-path friction
- Audit routes: dashboard, cars list/detail, entries, maintenance, todos, auth/onboarding.
- For each route, record:
  - primary goal,
  - number of taps to complete goal,
  - scroll depth to key CTA,
  - known friction points.

### Step 3: Prioritize and fix high-frequency flows
- Entry logging flow:
  - simplify first screen to required fields only,
  - keep advanced fields collapsible,
  - preserve selected car context and defaults.
- Todo flow:
  - one-tap status updates,
  - clear visual priority/status indicators.
- Maintenance flow:
  - quick glance due/overdue cards at top,
  - quick add for common interval templates.

### Step 4: Strengthen navigation ergonomics
- Ensure bottom nav is stable, unobtrusive, and thumb-reachable.
- Keep per-page top actions concise; avoid multiple competing CTAs.
- Add contextual floating CTA only where completion rate improves.

### Step 5: Improve form ergonomics and input quality
- Correct mobile `inputMode`/types for numeric and email fields.
- Keep label + hint text concise and visible.
- Inline validation with `aria-live` and non-blocking guidance.
- Maintain submit button visibility with long forms.

### Step 6: Accessibility and readability pass
- WCAG AA contrast for mobile contexts.
- Focus-visible states for keyboard and switch control users.
- Avoid color-only state communication.
- Dynamic type resilience and zoom-safe layouts.

### Step 7: Performance budget for mobile devices
- Limit client-side JS on high-traffic routes.
- Avoid expensive chart renders above the fold on low-end devices.
- Introduce skeleton loading and progressive content where needed.

### Step 8: Quality gates and QA protocol
- Manual QA on representative sizes: 320x568, 375x812, 390x844, 430x932.
- Test portrait and landscape for key screens.
- Validate keyboard behavior and safe-area handling.
- Track tap-path completion for top 3 workflows.

## Definition of Done
- Core workflows are demonstrably easier on mobile (fewer taps, less scrolling, faster completion).
- All main screens meet touch target and safe-area constraints.
- Accessibility checks for labels, focus, and live error messaging pass.
- A mobile QA checklist is added to PR workflow for future changes.

## Dependencies
- Depends on `T001` auth foundation.
- Should run alongside `T012` accessibility hardening and `T014` performance baseline.
