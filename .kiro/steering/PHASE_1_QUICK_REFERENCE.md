# Phase 1 Quick Reference - Developer Cheat Sheet

**Print this & keep it handy during development**

---

## 🎯 Phase 1 at a Glance

| What               | Where                                           | When    |
| ------------------ | ----------------------------------------------- | ------- |
| Popular Categories | `HomepageSectionItem` + featured_categories key | Day 1-2 |
| Browse Categories  | New `BrowseCategory` table                      | Day 2-3 |
| Header Mega Menus  | New `HeaderMegaMenu` + columns + categories     | Day 3-4 |

**Total Lines of Code:** ~2000  
**Duration:** 8 working days  
**Team:** 2 engineers + 1 QA

---

## 📋 Daily Checklist

### Day 1: Database Schema

- [ ] Update `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev`
- [ ] Verify schema created
- [ ] Update types in `src/types/homepage.ts`

### Day 2: Data Migration

- [ ] Create migration scripts in `scripts/`
- [ ] Test migrations with sample data
- [ ] Verify data in database
- [ ] Update validation schemas

### Day 3: Featured Categories API

- [ ] Create `src/app/api/admin/homepage/featured-categories/route.ts`
- [ ] Create `src/app/api/admin/homepage/featured-categories/[id]/route.ts`
- [ ] Test with curl/Postman
- [ ] Add error handling

### Day 4: Browse & Mega Menus API

- [ ] Create browse categories endpoints
- [ ] Create mega menus endpoints
- [ ] Create service layer functions
- [ ] Test all endpoints

### Day 5: Frontend Resolvers

- [ ] Create resolver functions with caching
- [ ] Add fallback to static data
- [ ] Add error logging
- [ ] Test with real database

### Day 6: Admin UI Components

- [ ] Create admin manager components
- [ ] Add form validation
- [ ] Add image upload support
- [ ] Wire up to API endpoints

### Day 7: Testing & QA

- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] Component tests for UI
- [ ] Manual testing of flows

### Day 8: Docs & Deployment

- [ ] Write admin workflow docs
- [ ] Final verification (build, lint, test, types)
- [ ] Deploy to production
- [ ] Monitor logs

---

## 🔧 Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check      # TypeScript check
npm run lint            # ESLint check
npm run test            # Run tests

# Database
npx prisma studio      # Open Prisma Studio
npx prisma migrate dev # Create migration
npx prisma generate    # Update client

# Deployment
npm run build           # Production build
npm run lint            # Final lint check
npm run test            # Final test check
npm run type-check      # Final type check
```

---

## 📁 File Structure

```
NEW FILES TO CREATE (19):

prisma/
├── migrations/[date]_add_browse_categories/migration.sql
├── migrations/[date]_add_header_mega_menus/migration.sql

scripts/
├── migrate-popular-categories.ts
├── migrate-browse-categories.ts
├── migrate-mega-menus.ts

src/app/api/admin/homepage/
├── featured-categories/route.ts
├── featured-categories/[id]/route.ts
├── browse-categories/route.ts
├── browse-categories/[id]/route.ts

src/app/api/admin/navigation/
├── mega-menus/route.ts
├── mega-menus/[id]/route.ts

src/lib/server/admin/
├── featuredCategoriesService.ts
├── browseCategoriesService.ts
├── megaMenusService.ts

src/lib/homepage/resolvers/
├── featuredCategoriesResolver.ts
├── browseCategoriesResolver.ts
├── megaMenusResolver.ts

src/components/admin/
├── FeaturedCategoriesManager.tsx
├── BrowseCategoriesManager.tsx
├── MegaMenusManager.tsx

FILES TO UPDATE (4):
- prisma/schema.prisma
- src/types/homepage.ts
- src/lib/validations/admin.ts
- src/app/admin/homepage/page.tsx
```

---

## 🗂️ API Endpoints

### Featured Categories

```
GET    /api/admin/homepage/featured-categories
POST   /api/admin/homepage/featured-categories
PUT    /api/admin/homepage/featured-categories/[id]
DELETE /api/admin/homepage/featured-categories/[id]
```

### Browse Categories

```
GET    /api/admin/homepage/browse-categories
POST   /api/admin/homepage/browse-categories
PUT    /api/admin/homepage/browse-categories/[id]
DELETE /api/admin/homepage/browse-categories/[id]
```

### Mega Menus

```
GET    /api/admin/navigation/mega-menus
POST   /api/admin/navigation/mega-menus
PUT    /api/admin/navigation/mega-menus/[id]
DELETE /api/admin/navigation/mega-menus/[id]
```

---

## 💾 Database Models

### HomepageSectionItem (Existing - Use for Featured Categories)

```
- id: string
- sectionKey: "featured_categories"
- categorySlug: string
- customImage?: string
- customTitle?: string
- customHref?: string
- badgeLabel?: string
- sortOrder: number (0-7)
- isActive: boolean
```

### BrowseCategory (New)

```
- id: string (cuid)
- categorySlug: string (unique)
- displayName: string
- description?: string
- imageUrl?: string
- customImage?: string
- sortOrder: number
- isActive: boolean
```

### HeaderMegaMenu (New)

```
- id: string (cuid)
- categoryId: string
- title: string
- slug: string (unique)
- sortOrder: number
- isActive: boolean
- columns: MegaMenuColumn[]
```

### MegaMenuColumn (New)

```
- id: string (cuid)
- megaMenuId: string (fk)
- title: string
- sortOrder: number
- isActive: boolean
- categories: MegaMenuCategory[]
```

### MegaMenuCategory (New)

```
- id: string (cuid)
- columnId: string (fk)
- categoryId: string
- sortOrder: number
- isActive: boolean
```

---

## ✅ Validation & Testing

### Input Validation

```typescript
// Use existing pattern from admin.ts
const schema = z.object({
  categorySlug: z.string().min(1),
  customImage: z.string().url().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean().optional(),
});
```

### Test Coverage Required

- ✅ Service layer: CRUD operations
- ✅ API endpoints: All methods (GET, POST, PUT, DELETE)
- ✅ Components: Render + user interactions
- ✅ Resolvers: Database + fallback + caching
- ✅ Integration: Admin → API → Database → Frontend

### Manual Testing Scenarios

```
Scenario 1: Create featured category
  1. Admin selects category from dropdown
  2. API POST /api/admin/homepage/featured-categories
  3. Verify category in database
  4. Refresh homepage
  5. Verify category appears in header navigation

Scenario 2: Edit browse category
  1. Admin edits display name
  2. API PUT /api/admin/homepage/browse-categories/[id]
  3. Verify updated in database
  4. Refresh homepage
  5. Verify change on browse section

Scenario 3: Delete mega menu
  1. Admin deletes mega menu
  2. API DELETE /api/admin/navigation/mega-menus/[id]
  3. Verify deleted from database
  4. Verify columns cascaded deleted
  5. Refresh homepage
  6. Verify navigation updated
```

---

## 🚀 Deployment Quick Start

```bash
# Pre-deployment (run in this order)
npm run type-check   # Must pass ✅
npm run lint         # Must pass ✅
npm run test         # Must pass ✅
npm run build        # Must succeed ✅

# Database migration
npx prisma migrate deploy

# Run data migration scripts
ts-node scripts/migrate-popular-categories.ts
ts-node scripts/migrate-browse-categories.ts
ts-node scripts/migrate-mega-menus.ts

# Verify data
psql $DATABASE_URL
SELECT COUNT(*) FROM homepage_section_items WHERE section_key = 'featured_categories';
SELECT COUNT(*) FROM browse_categories;
SELECT COUNT(*) FROM header_mega_menus;

# Deploy code
git push origin main
# CI/CD pipeline runs
```

---

## 📊 Success Metrics

### Performance

- [ ] API response time: < 100ms
- [ ] Database queries: < 50ms
- [ ] Homepage load: < 2 seconds
- [ ] Cache hit rate: > 95%

### Quality

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 new errors
- [ ] Tests: 973/973 + new tests passing
- [ ] Build: Succeeds

### Functionality

- [ ] Admin creates item → appears on frontend
- [ ] Admin edits item → change visible
- [ ] Admin deletes item → removed from frontend
- [ ] Reordering preserved
- [ ] Images upload & display
- [ ] Static fallback works

---

## 🛠️ Troubleshooting

### TypeScript Error: "Type 'X' is not assignable to type 'Y'"

→ Check section key matches exactly  
→ Check field names match schema  
→ Run `npx prisma generate`

### API Returns 400: "Invalid section key"

→ Verify `sectionKey` matches one of HOMEPAGE_SECTION_KEYS  
→ For featured_categories: sectionKey must be "featured_categories" (exact)

### Frontend Doesn't Show Updated Data

→ Clear browser cache (hard refresh: Ctrl+Shift+R)  
→ Check database has the data: `SELECT * FROM homepage_section_items WHERE section_key = 'featured_categories';`  
→ Check cache invalidation ran: `redis-cli KEYS "*"`  
→ Check fallback to static data working

### Database Migration Fails

→ Check PostgreSQL is running  
→ Check DATABASE_URL is correct  
→ Check migrations folder syntax  
→ Rollback: `npx prisma migrate resolve --rolled-back [migration-name]`

### Build Fails

→ Run `npm run type-check` to find type errors  
→ Run `npm run lint` to find lint errors  
→ Check all imports are correct  
→ Check no circular dependencies

---

## 📞 Getting Help

**For Schema Questions:** See Database Schema Specification doc  
**For Code Structure:** See Implementation Roadmap doc  
**For Timeline:** See Implementation Plan doc  
**For Deployment:** See Deployment Checklist in Handoff Summary

---

## ⏰ Time Tracking

### Day 1: Database (5 hours)

- [ ] 9:00-11:00: Schema update & migrations
- [ ] 11:00-12:00: Type updates
- [ ] 13:00-15:00: Migration script #1
- [ ] 15:00-17:00: Testing & verification

### Day 2: Data Migration (5 hours)

- [ ] 9:00-11:00: Migration scripts 2&3
- [ ] 11:00-12:00: Data verification
- [ ] 13:00-15:00: Schema updates
- [ ] 15:00-17:00: Type safety checks

### Days 3-8: Follow similar pattern

- Morning: Build/implement
- Mid-day: Test/verify
- Afternoon: Polish/document

---

## 🎓 Learning Resources

**Prisma Documentation:**

- https://www.prisma.io/docs/

**Next.js API Routes:**

- https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**React Query:**

- https://tanstack.com/query/latest/docs/react/overview

**TypeScript Handbook:**

- https://www.typescriptlang.org/docs/

---

**Print this page for quick reference during development!**

Last Updated: 31 October 2026  
Version: 1.0
