# IP-012: Accessibility Hardening

## Metadata
- Task ID: T012
- Title: Accessibility Hardening (keyboard nav, contrast, ARIA, focus management)
- Priority: P1
- Status: `draft`
- Related backlog item: T012

## 1. Problem Statement
The application uses Radix UI primitives (good baseline accessibility) but has not been audited for WCAG AA compliance. Custom components (StatCard, CarCard, dashboard sub-components) and form flows need accessibility verification.

## 2. Goals
- Keyboard navigation works for all CRUD flows
- Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text/UI components)
- ARIA labels on icon-only buttons and custom interactive components
- Focus management in modals, dialogs, and form submissions

## 3. Non-Goals
- WCAG AAA compliance
- Complex screen reader testing
- PDF/document accessibility
- Automated accessibility testing framework (could be part of T015/T016)

## 4. Scope
### In Scope
- Audit all 6 route pages: dashboard, cars, entries, maintenance, todos, settings
- Audit all dialog/modal interactions
- Audit all form flows
- Fix contrast issues on stat cards, charts, status badges
- Add ARIA labels to icon-only buttons (edit, delete, close)
- Verify focus trap in dialogs
- Verify focus return after dialog close

### Out Of Scope
- Screen reader optimization beyond semantic HTML + ARIA basics
- Automated a11y test suite

## 5. Acceptance Criteria
- [ ] All CRUD flows navigable via keyboard only
- [ ] Color contrast meets WCAG AA on all text and UI components
- [ ] Icon-only buttons have accessible labels
- [ ] Dialogs trap focus and return focus on close
- [ ] Form error messages are announced to assistive technology
- [ ] No accessibility regressions in existing flows
