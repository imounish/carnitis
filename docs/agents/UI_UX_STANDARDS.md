# UI/UX Standards

## 1. Product UX Principles
- Mobile-first by default.
- Clear primary action per screen.
- Reduce cognitive load via progressive disclosure.
- Keep interactions predictable and forgiving.

## 2. Responsive Design Rules
- Design smallest viewport first, then scale up.
- Ensure tap targets are at least 44x44 px.
- Avoid horizontal scrolling for core workflows.
- Use safe-area aware spacing for fixed/bottom UI.

## 3. Information Architecture
- Keep high-frequency actions within thumb reach on mobile.
- Prioritize core task content above decorative content.
- Keep page-level actions limited and intentional.

## 4. Accessibility Baseline
- WCAG AA color contrast target.
- Full keyboard operability.
- Semantic HTML first; ARIA only when needed.
- Inputs require visible labels and clear error messaging.
- Do not rely on color alone for status communication.

## 5. Form UX Standards
- Use correct input types and `inputMode` for mobile keyboards.
- Show inline validation near fields.
- Preserve entered values on non-fatal errors.
- Keep submit actions visible for long forms.

## 6. Visual Consistency
- Reuse shared primitives in `components/ui` before creating new ones.
- Keep spacing/typography scales consistent across routes.
- Prefer design token usage over one-off utility overrides.

## 7. Performance-Aware UX
- Avoid heavy client-side work above the fold on mobile.
- Use skeletons/progressive loading for perceived responsiveness.
- Defer non-critical visual enhancements when they hurt interactivity.
