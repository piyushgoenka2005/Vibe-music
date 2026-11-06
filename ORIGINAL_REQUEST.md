# Original User Request

## Initial Request — 2026-11-06T18:50:12Z

Audit root causes and issues deeply across the Vibe Music codebase and live application, and implement fixes for all broken, incomplete, and non-functional items to make the platform completely functional and production-ready.

Integrity mode: development

Context and Reference:

- Application: Vibe Music (musical instruments and pro audio ecommerce store)
- Tech Stack: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL (Prisma ORM), Tailwind/vanilla CSS, PM2, Nginx
- Production URL: https://vibemusic.in
- Production Server: 109.122.56.126 (directory: /root/Vibe-music, PM2 process: vibe)
- Git Repository: https://github.com/piyushgoenka2005/Vibe-music (branch: main)

## Requirements

### R1. Storefront & Mobile Responsiveness Audit and Remediation

Audit root causes and fix all broken, incomplete, or non-functional features across the storefront:

- Header navigation and mega menus
- Category and subcategory listing pages
- Product search and filtering
- Product detail pages (PDP)
- Cart and checkout flows
- Rentals, giveaways, brand pages, blog, and account area
- Full mobile responsiveness across all pages, navigation drawers, filter drawers, modals, tables, and buttons on mobile viewports

### R2. Admin Portal Audit and Remediation

Audit root causes and resolve all broken, incomplete, or non-functional features in the Admin Portal:

- Products, Category Management, and Master Taxonomy
- Homepage Sections, Orders, Rentals, and Banners
- Navigation, SEO, and Settings

### R3. Backend, Database, and Build Quality

Audit and resolve all issues across backend and infrastructure components:

- Prisma queries, data integrity, error logging, rate limiting, security headers, Redis caching, and webhook handlers
- TypeScript checks must pass with zero errors
- ESLint checks must pass with no errors
- Vitest unit test suites must execute successfully
- No unresolved image assets, broken routes, or memory leak warnings in console logs

### R4. Production Deployment & Live Verification

Deploy the verified codebase fixes to the live production server (109.122.56.126, directory `/root/Vibe-music`, PM2 process `vibe`), ensuring the live service at `https://vibemusic.in` is active and healthy without regressions.

## Acceptance Criteria

### Build & Code Quality

- [ ] TypeScript compilation (`tsc --noEmit` or `npm run type-check`) passes with 0 errors.
- [ ] ESLint passes with no errors.
- [ ] Vitest unit test suite runs and all tests pass.
- [ ] Production build succeeds without errors.
- [ ] Console logs show no unresolved image assets, broken routes, or memory warnings.

### Storefront & Mobile

- [ ] Storefront navigation, mega menus, search, category/subcategory pages, PDP, cart, checkout, rentals, giveaways, brand pages, blog, and account area load and operate without unhandled errors.
- [ ] All pages, navigation drawers, filter drawers, modals, tables, and action buttons render correctly and function on mobile viewports.

### Admin Portal

- [ ] Admin portal modules (Products, Category Management, Master Taxonomy, Homepage Sections, Orders, Rentals, Banners, Navigation, SEO, Settings) load, save, update, and display records properly.

### Backend & Infrastructure

- [ ] API routes, Prisma queries, rate limiting, security headers, Redis caching, and webhooks function properly with mock/seed data.

### Live Production Deployment

- [ ] Verified codebase is deployed to production server 109.122.56.126 in `/root/Vibe-music` and PM2 process `vibe` is online.
- [ ] Live application at `https://vibemusic.in` responds successfully on storefront and core routes.
