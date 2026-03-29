# IP-013: UX Consistency Pass

## Metadata
- Task ID: T013
- Title: UX Consistency Pass (navigation, empty states, progressive disclosure)
- Priority: P2
- Status: `draft`
- Related backlog item: T013

## 1. Problem Statement
While individual routes work correctly, the overall UX experience may lack consistency across the 6 route pages. Empty states, loading patterns, navigation breadcrumbs, and progressive disclosure need a unified approach.

## 2. Goals
- Consistent empty states across all routes
- Consistent loading patterns
- Unified navigation and breadcrumb experience
- Progressive disclosure for advanced features

## 3. Scope
### Pages to audit
- Dashboard (`/`)
- Cars list (`/cars`) and detail (`/cars/[id]`)
- Entries (`/entries`)
- Maintenance (`/maintenance`)
- Todos (`/todos`)
- Settings (`/settings`)

### Aspects to check
- Empty state messaging and CTAs
- Loading/skeleton states
- Navigation consistency
- Error state presentation
- Progressive disclosure of advanced fields

## 4. Acceptance Criteria
- [ ] All routes have consistent, helpful empty states
- [ ] Loading patterns are uniform
- [ ] Navigation is predictable across all pages
- [ ] Advanced features use progressive disclosure
- [ ] No jarring UX inconsistencies between routes
