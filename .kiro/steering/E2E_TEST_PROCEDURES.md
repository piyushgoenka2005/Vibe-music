# End-to-End Test Procedures - Categories Loading Error Fix & Real-Time Sync

**Date:** 31 October 2026  
**Status:** ✅ COMPREHENSIVE E2E TESTING GUIDE  
**Target Audience:** QA Teams, Developers, DevOps, Product Managers

---

## Overview

This document provides complete step-by-step procedures to verify:

1. **Categories Loading Error is Fixed** - No error after deleting all categories
2. **Real-Time Category Sync Works** - Admin updates appear immediately on frontend
3. **Subcategories Display Correctly** - Proper hierarchy and navigation
4. **Error Handling is Robust** - System never crashes or throws errors

---

## Prerequisites

### Environment Setup Required

- [ ] Local development environment running (`npm run dev`)
- [ ] PostgreSQL database running and seeded with test data
- [ ] Redis cache configured (or using in-memory fallback)
- [ ] NGINX cache directory configured (optional for production testing)
- [ ] Browser with DevTools open (F12)
- [ ] Server logs visible (terminal running the dev server)
- [ ] Network tab open in browser DevTools

### Test Accounts Required

- Admin account with `categories:read` and `categories:write` permissions
- Test category data pre-populated in database

### Browser Setup

```
1. Open two browser windows side-by-side
   - Left: Admin panel (http://localhost:3000/admin/categories)
   - Right: Frontend homepage (http://localhost:3000)

2. Enable DevTools in both
   - Left: Console + Network tabs
   - Right: Console only

3. Optional: Open three windows
   - Left: Admin categories page
   - Middle: Frontend homepage
   - Right: Category detail page
```

---

## Test Suite 1: Categories Loading Error is Fixed

### Test 1.1: Admin Page Loads Without Error

**Objective:** Verify the admin categories page loads successfully in all scenarios

**Steps:**

```
1. Navigate to http://localhost:3000/admin/categories
2. Observe the page loads
3. Verify categories table displays
4. Check console for errors (F12 → Console)
5. Check network tab for 200 status on /api/admin/categories
```

**Expected Results:**

- ✅ Page loads within 2 seconds
- ✅ Categories table visible with data
- ✅ No console errors
- ✅ API response status 200
- ✅ API response contains `{ categories: [...] }`

**Failure Indicators:**

- ❌ "Unable to load categories" error displayed
- ❌ Empty state message with retry button
- ❌ Console shows JavaScript error
- ❌ Network tab shows 500 status

---

### Test 1.2: Delete All Categories Scenario

**Objective:** Verify deleting all categories doesn't show error and system remains functional

**Duration:** 5 minutes

**Steps:**

```
1. Admin panel open: http://localhost:3000/admin/categories

2. Delete all categories (one by one):
   a. Click first category row
   b. Click delete button
   c. Confirm deletion
   d. Wait for toast notification
   e. Verify category removed from list
   f. Repeat for all categories until table is empty

3. After all deleted:
   a. Page should still show empty categories table
   b. No error message should appear
   c. "Add Category" button should still work
   d. Refresh page (F5)
   e. Verify page loads without error

4. Console check:
   a. Open DevTools Console
   b. Look for any red error messages
   c. Check for warnings about "Unable to load"
```

**Expected Results:**

- ✅ All categories deleted successfully one by one
- ✅ Empty table displayed (no data rows)
- ✅ No "Unable to load categories" error
- ✅ Page still functional
- ✅ "Add Category" button works
- ✅ Page refresh shows empty table (no error)
- ✅ Console clean (no errors)

**Failure Indicators:**

- ❌ "Unable to load categories" error shown
- ❌ Red error in console
- ❌ Retry button appears
- ❌ Page becomes unresponsive
- ❌ Refresh shows error instead of empty table

**Server Logs Expected:**

```
[categoryRepository] seedCategoriesFromStatic() triggered (database empty)
[categoryRepository] Static categories loaded as fallback
// Note: If products service fails, you'll see:
[categoryRepository] Failed to load products for seeding, continuing with empty products
```

---

### Test 1.3: Restore Categories After Deletion

**Objective:** Verify system can restore categories after deletion without errors

**Duration:** 3 minutes

**Steps:**

```
1. Previous state: All categories deleted (empty database)
2. Admin panel: http://localhost:3000/admin/categories

3. Click "Add Category" button

4. Fill form:
   - Name: "Test Guitars"
   - Slug: "test-guitars"
   - Description: "Quality Guitars"
   - Featured: No
   - Sort Order: 0

5. Click "Save" button

6. Observe:
   a. Toast notification appears
   b. New category added to table
   c. No errors in console
   d. Network tab shows 201 status

7. Verify database has category:
   a. Check if "Test Guitars" appears in table
   b. Product count may show 0 initially
   c. Refresh page to verify persistence
```

**Expected Results:**

- ✅ Category created successfully
- ✅ Toast confirmation shown
- ✅ Category appears in table
- ✅ API returns 201 status
- ✅ Category persists after page refresh
- ✅ No errors during creation

**Failure Indicators:**

- ❌ Creation fails with error
- ❌ Category not in table after save
- ❌ API returns error status (400, 500, etc.)
- ❌ Console shows error

---

## Test Suite 2: Real-Time Category Sync

### Test 2.1: Frontend Updates on Admin Create

**Objective:** Verify new categories appear on frontend immediately after creation

**Duration:** 3 minutes

**Setup:**

```
Browser Window 1 (Admin):
  http://localhost:3000/admin/categories
  DevTools: Console + Network

Browser Window 2 (Frontend):
  http://localhost:3000
  DevTools: Console
```

**Steps:**

```
1. Frontend window: http://localhost:3000
   - Take screenshot of header navigation
   - Note categories shown in mega menu

2. Admin window: Click "Add Category"
   - Name: "Test Keyboards"
   - Slug: "test-keyboards"
   - Featured: No
   - Save

3. Observe admin window:
   a. Toast notification appears
   b. Network tab shows cache invalidation requests
   c. Look for "revalidateTag" or "purge" logs

4. Frontend window: Refresh page (F5)
   - Wait for page to load
   - Check header navigation

5. Verify:
   a. "Test Keyboards" appears in navigation
   b. Clicking it navigates to category page
   c. No console errors
   d. Page load time normal
```

**Expected Results:**

- ✅ Category appears in frontend after refresh
- ✅ Category link is clickable
- ✅ Category page loads without 404
- ✅ No console errors on frontend
- ✅ Page load time < 2 seconds
- ✅ Cache invalidation occurs

**Failure Indicators:**

- ❌ Category doesn't appear in navigation
- ❌ Category link shows 404
- ❌ Console shows error
- ❌ Page load time > 5 seconds

**Network Tab Expected:**

```
Request: /api/admin/categories (POST)
Status: 201
Response: { category: {...} }

Then cache invalidation sequence:
- revalidatePath calls for affected routes
- Redis cache updates (if configured)
```

---

### Test 2.2: Frontend Updates on Admin Update Category

**Objective:** Verify category name changes appear immediately on frontend

**Duration:** 3 minutes

**Setup:**

```
Browser Window 1 (Admin):
  http://localhost:3000/admin/categories

Browser Window 2 (Frontend):
  http://localhost:3000
  Look for the category you're updating in navigation
```

**Steps:**

```
1. Frontend window:
   - Screenshot header navigation
   - Find "Test Keyboards" category visible

2. Admin window:
   - Find "Test Keyboards" in list
   - Click to edit
   - Change name to "Test Keyboards Updated"
   - Click Save

3. Observe:
   a. Toast notification in admin
   b. Category updated in admin table
   c. Network shows cache invalidation

4. Frontend window:
   - Hard refresh (Ctrl+Shift+R)
   - Look for updated category name

5. Verify:
   a. Category name shows "Test Keyboards Updated"
   b. Category still works when clicked
   c. No errors in console
```

**Expected Results:**

- ✅ Updated name appears on frontend after refresh
- ✅ Category functionality unchanged
- ✅ No 404 errors
- ✅ No console errors

**Failure Indicators:**

- ❌ Old name still shows
- ❌ 404 error for category
- ❌ Console error

---

### Test 2.3: Frontend Updates on Admin Delete Category

**Objective:** Verify deleted categories disappear from frontend immediately

**Duration:** 3 minutes

**Setup:**

```
Browser Window 1 (Admin):
  http://localhost:3000/admin/categories

Browser Window 2 (Frontend):
  http://localhost:3000
  Note categories in navigation
```

**Steps:**

```
1. Frontend window:
   - Screenshot current header navigation
   - Verify "Test Keyboards Updated" is visible

2. Admin window:
   - Find "Test Keyboards Updated" in list
   - Click delete button
   - Confirm deletion
   - Observe toast notification

3. Frontend window:
   - Hard refresh page (Ctrl+Shift+R)
   - Check header navigation

4. Verify:
   a. "Test Keyboards Updated" no longer in navigation
   b. No broken links
   c. No 404 errors in console
   d. Navigation looks complete
```

**Expected Results:**

- ✅ Deleted category removed from navigation
- ✅ No broken links
- ✅ No console errors
- ✅ Navigation displays correctly without the deleted item

**Failure Indicators:**

- ❌ Deleted category still visible
- ❌ Navigation shows broken links
- ❌ Console shows 404 errors

---

## Test Suite 3: Subcategories Display & Sync

### Test 3.1: Create and Display Subcategories

**Objective:** Verify subcategories appear in correct columns of mega menu

**Duration:** 5 minutes

**Setup:**

```
Prerequisites:
- At least one main category exists
- Access to admin categories page
```

**Steps:**

```
1. Admin: http://localhost:3000/admin/categories

2. Create main category (if not exists):
   a. Click "Add Category"
   b. Name: "Test Drums"
   c. Slug: "test-drums"
   d. Save
   e. Verify created

3. Create subcategory:
   a. Find "Test Drums" in list
   b. Click "Add Subcategory" button
   c. Name: "Acoustic Drums"
   d. Slug: "acoustic-drums"
   e. Parent: "Test Drums" (auto-selected)
   f. Sort Order: 0
   g. Save
   h. Verify created

4. Create another subcategory:
   a. Click "Add Subcategory" for "Test Drums" again
   b. Name: "Electronic Drums"
   c. Slug: "electronic-drums"
   d. Parent: "Test Drums"
   e. Sort Order: 1
   f. Save

5. Admin verify:
   a. Both subcategories show under "Test Drums"
   b. Correct sort order
   c. Parent relationship shown

6. Frontend check:
   a. Navigate to http://localhost:3000
   b. Hard refresh
   c. Hover over "Test Drums" in header
   d. Check mega menu
   e. Verify both subcategories appear
   f. Click each subcategory
   g. Verify landing page loads
```

**Expected Results:**

- ✅ Subcategories created successfully
- ✅ Parent-child relationship established
- ✅ Subcategories appear in admin list under parent
- ✅ Mega menu shows both subcategories
- ✅ Subcategories sorted in correct order
- ✅ Subcategory pages load without 404
- ✅ Navigation breadcrumb shows parent

**Failure Indicators:**

- ❌ Subcategory creation fails
- ❌ Subcategories don't appear under parent
- ❌ Mega menu doesn't show subcategories
- ❌ Subcategory pages show 404
- ❌ Broken parent-child relationship

**Database Verification:**

```sql
-- Check subcategories were created with correct parent
SELECT id, name, parentId, sortOrder FROM categories
WHERE parentId IS NOT NULL
ORDER BY parentId, sortOrder;

-- Should see:
| id        | name             | parentId | sortOrder |
|-----------|------------------|----------|-----------|
| xyz123    | Acoustic Drums   | abc789   | 0         |
| xyz124    | Electronic Drums | abc789   | 1         |
```

---

### Test 3.2: Update Subcategory Sort Order

**Objective:** Verify subcategory sort order changes are reflected in mega menu

**Duration:** 3 minutes

**Setup:**

```
Prerequisites:
- Parent category "Test Drums" with subcategories exists
- Frontend showing correct order
```

**Steps:**

```
1. Admin: http://localhost:3000/admin/categories

2. Edit "Electronic Drums" subcategory:
   a. Find and click "Electronic Drums"
   b. Change Sort Order from 1 to 0
   c. Save

3. Edit "Acoustic Drums" subcategory:
   a. Find and click "Acoustic Drums"
   b. Change Sort Order from 0 to 1
   c. Save

4. Admin verify:
   a. List now shows "Electronic Drums" before "Acoustic Drums"
   b. Sort order values updated

5. Frontend check:
   a. Refresh page
   b. Hover over "Test Drums"
   c. Verify "Electronic Drums" appears first
   d. Verify "Acoustic Drums" appears second
```

**Expected Results:**

- ✅ Sort order updated in database
- ✅ Admin list reflects new order
- ✅ Frontend mega menu reflects new order
- ✅ Changes visible after page refresh

**Failure Indicators:**

- ❌ Sort order not updated
- ❌ Old order persists in mega menu
- ❌ Cache not invalidated

---

### Test 3.3: Delete Parent Category (Cascading Delete)

**Objective:** Verify subcategories are deleted when parent is deleted

**Duration:** 3 minutes

**Setup:**

```
Prerequisites:
- Parent "Test Drums" with subcategories exists
```

**Steps:**

```
1. Admin: http://localhost:3000/admin/categories

2. Count subcategories:
   a. Under "Test Drums" should see 2 subcategories
   b. Note their names

3. Delete parent category:
   a. Find "Test Drums"
   b. Click delete
   c. Confirm deletion
   d. Observe toast notification

4. Admin verify:
   a. "Test Drums" removed from list
   b. Subcategories "Acoustic Drums" and "Electronic Drums" also gone
   c. No orphaned subcategories
   d. Refresh page to confirm

5. Database check:
   a. Search for "Acoustic Drums" and "Electronic Drums"
   b. Should not exist

6. Frontend check:
   a. Refresh http://localhost:3000
   b. "Test Drums" should not appear in header
   c. No broken links to subcategories
```

**Expected Results:**

- ✅ Parent category deleted
- ✅ All subcategories cascade deleted
- ✅ No orphaned data in database
- ✅ Frontend navigation updated
- ✅ No broken links

**Failure Indicators:**

- ❌ Parent deleted but subcategories remain
- ❌ Orphaned subcategories in database
- ❌ Broken links in frontend
- ❌ Console shows 404 errors

---

## Test Suite 4: Error Handling & Edge Cases

### Test 4.1: Product Service Unavailable

**Objective:** Verify system handles product service failures gracefully

**Duration:** 5 minutes

**Prerequisite:**

```
Understanding: This tests the fallback mechanism when getAllProducts() fails
```

**Steps:**

```
1. Delete all categories first:
   - Admin: http://localhost:3000/admin/categories
   - Delete every category (or start with empty DB)

2. Restart application to force fresh seed attempt:
   - Note: In development, you can simulate by clearing cache

3. Observe server logs:
   - Look for "[categoryRepository]" messages
   - Should see seed attempt

4. Admin page load:
   a. Navigate to http://localhost:3000/admin/categories
   b. Page should load without error (even if product service fails)
   c. Categories should display with 0 product counts
   d. No "Unable to load categories" error

5. Verify fallback activated:
   a. Check server logs for:
      "[categoryRepository] Failed to load products for seeding, continuing with empty products"
   b. This indicates fallback worked correctly
```

**Expected Results:**

- ✅ Page loads despite product service failure
- ✅ Categories display with 0 counts
- ✅ No error shown to user
- ✅ Fallback log message appears in server logs
- ✅ System remains functional

**Failure Indicators:**

- ❌ "Unable to load categories" error
- ❌ Page doesn't load
- ❌ Red error in console

**Server Logs to Verify:**

```
Expected when product service fails:
[categoryRepository] Failed to load products for seeding, continuing with empty products: Error: Connection refused

Result: Categories still loaded with productCount = 0
```

---

### Test 4.2: Network Latency Simulation

**Objective:** Verify system handles slow responses gracefully

**Duration:** 3 minutes

**Steps:**

```
1. Open DevTools: F12 → Network tab

2. Set network throttling:
   - Click "No throttling" dropdown
   - Select "Slow 3G" or "Dial-up"

3. Navigate to admin: http://localhost:3000/admin/categories

4. Observe:
   a. Page loads (slower than normal)
   b. Categories eventually display
   c. No timeout errors
   d. No "Unable to load categories" error

5. Reset throttling:
   - Set back to "No throttling"
```

**Expected Results:**

- ✅ Page loads despite slow network
- ✅ Categories display eventually
- ✅ No timeout errors
- ✅ No error messages

**Failure Indicators:**

- ❌ Timeout error
- ❌ "Unable to load categories" error
- ❌ Page fails to load

---

### Test 4.3: Concurrent Operations

**Objective:** Verify system handles multiple simultaneous operations correctly

**Duration:** 5 minutes

**Setup:**

```
Three browser windows:
- Window 1: Admin categories page
- Window 2: Frontend homepage
- Window 3: Another admin categories page (same session or different)
```

**Steps:**

```
1. Window 1 (Admin A):
   a. Open http://localhost:3000/admin/categories
   b. Keep open and ready to create category

2. Window 3 (Admin B):
   a. Open http://localhost:3000/admin/categories in new tab/window
   b. Keep open and ready to create category

3. Window 2 (Frontend):
   a. Open http://localhost:3000
   b. Keep open and ready to refresh

4. Execute concurrent operations:
   a. Admin A: Click "Add Category"
   b. Type: "Test Concurrent 1"
   c. Don't save yet

   d. Admin B: Click "Add Category"
   e. Type: "Test Concurrent 2"
   f. Don't save yet

   g. Admin A: Click Save
   h. Admin B: Click Save
   i. Frontend: Refresh

5. Verify results:
   a. Both categories created successfully
   b. No conflicts or errors
   c. Admin A and B both show updated list
   d. Frontend shows both new categories
   e. No database corruption
   f. No duplicate IDs
```

**Expected Results:**

- ✅ Both categories created
- ✅ No conflicts
- ✅ Database remains consistent
- ✅ Both admin windows show correct data
- ✅ Frontend shows both categories
- ✅ No errors in any console

**Failure Indicators:**

- ❌ One operation fails
- ❌ Duplicate IDs created
- ❌ Database corruption
- ❌ Inconsistent state between windows

---

## Test Suite 5: Performance Verification

### Test 5.1: Initial Page Load Time

**Objective:** Verify categories page loads within acceptable time

**Duration:** 3 minutes

**Steps:**

```
1. Admin: http://localhost:3000/admin/categories

2. Open DevTools: F12 → Network tab

3. Clear cache and hard refresh:
   a. Right-click page
   b. Select "Empty cache and hard refresh"
   c. Note load time

4. Observe metrics:
   a. Document Time to First Byte (TTFB)
   b. Document page load time
   c. Total time for all resources

5. Expected times:
   - TTFB: < 500ms
   - Page load: < 2 seconds
   - Total resources: < 3 seconds

6. Open DevTools → Performance tab:
   a. Record page load
   b. Check for long tasks
   c. Verify smooth rendering
```

**Expected Results:**

- ✅ TTFB < 500ms
- ✅ Page load < 2 seconds
- ✅ No long tasks (> 50ms)
- ✅ Smooth 60fps rendering

**Failure Indicators:**

- ❌ Page load > 5 seconds
- ❌ Multiple long tasks
- ❌ Jank or stuttering
- ❌ High CPU usage

---

### Test 5.2: Cache Hit Performance

**Objective:** Verify cached requests are fast

**Duration:** 2 minutes

**Steps:**

```
1. Admin: http://localhost:3000/admin/categories

2. Measure first load (from previous test)
   - Note load time

3. Reload page: F5
   - Observe load time
   - Should be much faster (cache hit)

4. Network tab:
   a. First request: Full response
   b. Second request: Partial response (if server-side cache)

5. Expected performance:
   - Cache hit: < 500ms
   - Should be 2-5x faster than first load
```

**Expected Results:**

- ✅ Cached reload < 500ms
- ✅ Significantly faster than first load
- ✅ No unnecessary requests

**Failure Indicators:**

- ❌ Cached reload still slow
- ❌ No improvement in load time
- ❌ Cache not being used

---

## Test Suite 6: Database Integrity

### Test 6.1: Verify Schema Integrity

**Objective:** Verify database schema matches expected structure

**Duration:** 5 minutes

**Steps:**

```
1. Connect to PostgreSQL:
   psql -U your_user -d your_database

2. Check categories table:
   \d categories

3. Verify columns exist:
   - id (UUID, PRIMARY KEY)
   - name (VARCHAR, NOT NULL)
   - slug (VARCHAR, UNIQUE)
   - parentId (UUID, FOREIGN KEY to categories.id)
   - sortOrder (INTEGER)
   - description (TEXT)
   - imageUrl (VARCHAR)
   - isFeatured (BOOLEAN)
   - metaTitle (VARCHAR)
   - metaDescription (TEXT)
   - productCount (INTEGER)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)

4. Verify indexes:
   - Primary key on id
   - Unique on slug
   - Foreign key on parentId
   - Index on parentId (for subcategory lookups)
   - Index on sortOrder

5. SQL to verify:
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'categories'
   ORDER BY ordinal_position;
```

**Expected Results:**

- ✅ All required columns exist
- ✅ Correct data types
- ✅ Indexes present
- ✅ Foreign key constraints active

**Failure Indicators:**

- ❌ Missing columns
- ❌ Wrong data types
- ❌ Missing indexes
- ❌ No foreign key constraint

---

### Test 6.2: Verify Data Relationships

**Objective:** Verify category-subcategory relationships are correct

**Duration:** 3 minutes

**Steps:**

```
1. PostgreSQL:
   psql -U your_user -d your_database

2. Check for orphaned subcategories:
   SELECT * FROM categories
   WHERE parentId NOT NULL
   AND parentId NOT IN (SELECT id FROM categories WHERE parentId IS NULL);

3. Expected: Empty result (no orphaned subcategories)

4. Check subcategories:
   SELECT id, name, parentId, sortOrder
   FROM categories
   WHERE parentId IS NOT NULL
   ORDER BY parentId, sortOrder;

5. Verify:
   a. Each parentId exists in categories table
   b. Sort order is sequential for each parent
   c. No negative or duplicate sortOrder values
```

**Expected Results:**

- ✅ No orphaned subcategories
- ✅ All parentIds valid
- ✅ Sort order consistent
- ✅ Data relationships intact

**Failure Indicators:**

- ❌ Orphaned subcategories found
- ❌ Invalid parentIds
- ❌ Duplicate sort orders
- ❌ Data inconsistencies

---

## Test Suite 7: Monitoring & Logging

### Test 7.1: Verify Error Logs

**Objective:** Verify error messages appear in logs when appropriate

**Duration:** 5 minutes

**Steps:**

```
1. Terminal: Watch server logs
   npm run dev
   (Keep terminal visible)

2. Trigger expected log events:

   a. Delete all categories:
      - Admin: Delete every category
      - Watch logs for: "[categoryRepository]" messages

   b. Refresh admin page:
      - Should see seed operation in logs

   c. Expected log messages:
      [categoryRepository] seedCategoriesFromStatic() triggered
      [categoryRepository] Static categories loaded
      [categoryRepository] listCategories() completed

3. Create new category:
   - Admin: Add "Test Logging"
   - Watch for cache invalidation logs:
      [categoryRepository] Invalidating caches
      [storefront-cache] Revalidating tags

4. Look for concerning logs:
   a. "[categoryRepository] Failed to load products" = OK (fallback activated)
   b. "[categoryRepository] Error" = Check details but should not crash
   c. No red/error level logs unless expected
```

**Expected Results:**

- ✅ Informational logs appear for operations
- ✅ Cache invalidation logged
- ✅ Fallback logs appear when triggered
- ✅ No unexpected error logs
- ✅ Operations continue despite logged issues

**Failure Indicators:**

- ❌ No logs for operations
- ❌ Error logs not appearing
- ❌ Operation fails when logs appear
- ❌ System crashes

**Log Patterns to Monitor:**

```
✅ EXPECTED:
[categoryRepository] Invalidating caches
[storefront-cache] Revalidating tags
[categoryRepository] Failed to load products..., continuing with empty products

❌ UNEXPECTED:
Unhandled Error: ...
FATAL: ...
Segmentation fault
```

---

### Test 7.2: Monitor Cache Invalidation

**Objective:** Verify cache invalidation happens automatically

**Duration:** 3 minutes

**Steps:**

```
1. Browser DevTools: Network tab (keep open)

2. Admin: Create new category
   a. Click "Add Category"
   b. Name: "Test Cache"
   c. Save

3. Watch network tab for:
   a. POST /api/admin/categories (201 Created)
   b. Following that, should see cache-related activity
   c. Possibly see tag invalidation requests
   d. revalidatePath calls

4. Frontend: Refresh immediately after save
   - Should see fresh content

5. Frontend: Hard refresh (Ctrl+Shift+R)
   - Should show newest category

6. Backend verification:
   a. Check server logs for cache messages
   b. Look for "revalidateTag" or "purge" messages
```

**Expected Results:**

- ✅ Cache invalidation occurs after create/update/delete
- ✅ Frontend reflects changes on next request
- ✅ Multiple cache layers cleared
- ✅ Tags revalidated

**Failure Indicators:**

- ❌ No cache invalidation
- ❌ Frontend shows stale data
- ❌ Multiple refreshes needed to see changes

---

## Summary Checklist

After completing all tests, verify:

### Categories Loading Error - FIXED

- [ ] Admin page loads without "Unable to load categories" error
- [ ] Deleting all categories doesn't show error
- [ ] Page remains functional after deletion
- [ ] Categories can be created after deletion
- [ ] System gracefully handles product service failures
- [ ] Fallback data is meaningful and functional

### Real-Time Sync - WORKING

- [ ] New categories appear on frontend within 1 page refresh
- [ ] Updated category names reflect immediately
- [ ] Deleted categories disappear from navigation
- [ ] Subcategories appear in correct mega menu columns
- [ ] Sort order preserved in navigation
- [ ] Cache invalidation occurs automatically

### System Integrity - VERIFIED

- [ ] No console errors during operations
- [ ] Database schema correct and intact
- [ ] No orphaned data
- [ ] Parent-child relationships maintained
- [ ] All indexes present
- [ ] Performance acceptable (< 2 seconds page load)

### Error Handling - ROBUST

- [ ] Network latency handled gracefully
- [ ] Concurrent operations don't cause conflicts
- [ ] System never crashes
- [ ] Appropriate error logging
- [ ] User-friendly error messages (never technical errors)

---

## Troubleshooting Failed Tests

### Issue: "Unable to load categories" still appears

**Solution:**

1. Verify categoryRepository.ts has error handling layers
2. Check server logs for specific error message
3. Verify database connection working
4. Check if product service is accessible
5. Clear browser cache and try again

### Issue: Categories don't sync to frontend

**Solution:**

1. Verify buildCategoryMegaMenus.ts is called
2. Check getCategoryCatalog() is fetching fresh data
3. Verify cache invalidation tags are correct
4. Check if revalidatePath is being called
5. Hard refresh browser (Ctrl+Shift+R)

### Issue: Subcategories not showing

**Solution:**

1. Verify parentId is set correctly in database
2. Check subcategories aren't accidentally deleted
3. Verify parent category still exists
4. Check sort order values
5. Refresh page after creating subcategory

### Issue: Performance is slow

**Solution:**

1. Check network throttling (DevTools)
2. Verify database indexes created
3. Check if cache is being used
4. Look for N+1 queries in logs
5. Try hard refresh to clear cache

---

## Document Information

**Created:** 31 October 2026  
**Test Coverage:** 7 suites, 15+ individual tests  
**Estimated Total Time:** 1-2 hours for complete E2E verification  
**Maintenance:** Review quarterly or after major changes

**Test Status:** ✅ Ready for use  
**Last Updated:** 31 October 2026  
**Next Review:** After deployment to production

---

**END OF E2E TEST PROCEDURES**
