# IP-014: Performance Baseline

## Metadata
- Task ID: T014
- Title: Performance Baseline (RSC/client boundaries + bundle audit)
- Priority: P1
- Status: `draft`
- Related backlog item: T014

## 1. Problem Statement
No performance audit has been done. RSC/client component boundaries may not be optimal (especially post-dashboard migration). Bundle size is unknown. Client-side JS may include unnecessary code.

## 2. Goals
- Audit RSC vs client component boundaries across all routes
- Measure and document bundle size
- Identify and fix unnecessary client-side JS
- Establish performance baseline metrics

## 3. Scope
### In Scope
- RSC/client boundary audit for all routes
- Bundle analysis (next/bundle-analyzer or similar)
- Identify components that should be server components
- Optimize `"use client"` boundaries
- Document performance baseline (LCP, FID, CLS)

### Out Of Scope
- CDN/caching optimization
- Image optimization beyond Next.js defaults
- Database query optimization

## 4. Acceptance Criteria
- [ ] RSC/client boundaries reviewed and optimized
- [ ] Bundle analysis documented
- [ ] No unnecessary `"use client"` directives
- [ ] Performance baseline documented (Core Web Vitals)
- [ ] No performance regressions from changes
