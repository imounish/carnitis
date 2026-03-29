# IP-021: Deployment + Hosting Configuration

## Metadata
- Task ID: T021
- Title: Deployment + Hosting Configuration
- Priority: P0
- Status: `draft`
- Related backlog item: T021

## 1. Problem Statement
The application has no deployment infrastructure. No git remote, no CI/CD, no hosting configuration, no production database. The app cannot be accessed by users.

## 2. Goals
- Application deployed and accessible on a public URL
- Production Supabase database provisioned and migrated
- Environment variables configured for production
- Domain with SSL configured

## 3. Non-Goals
- Multi-region deployment
- CDN optimization
- Custom domain email
- Staging environment (can add later)

## 4. Scope
### In Scope
- Git remote setup (GitHub)
- Vercel project configuration
- Production Supabase project provisioning
- Database migration to production
- Environment variable configuration
- Domain and SSL setup
- Successful production build and deployment

### Out Of Scope
- CI/CD pipeline (see T016)
- Error monitoring (see T022)
- Performance optimization (see T014)

## 5. Constraints And Assumptions
- Vercel is the recommended hosting platform for Next.js
- Supabase cloud provides managed Postgres
- Better Auth requires `BETTER_AUTH_URL` to match the production domain

## 6. Implementation Steps
1. Create GitHub repository and push code
2. Create production Supabase project
3. Run database migrations against production Supabase
4. Create Vercel project linked to GitHub repo
5. Configure environment variables in Vercel
6. Configure custom domain and SSL
7. Trigger first production deployment
8. Verify all routes work in production
9. Verify auth flow (sign-up, sign-in, Google OAuth) in production

## 7. Acceptance Criteria
- [ ] Code pushed to GitHub repository
- [ ] Vercel project deployed and accessible
- [ ] Production Supabase database with schema migrated
- [ ] All environment variables configured
- [ ] Domain with SSL working
- [ ] Auth flow works in production
- [ ] All routes render real data
