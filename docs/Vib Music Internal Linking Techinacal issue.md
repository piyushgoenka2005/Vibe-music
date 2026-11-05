# Vibe Music Website

## Internal Linking, Category Navigation, Search \& SEO Technical Correction Specification

**Website:** https://vibemusic.in/  
**Project:** Technical audit and remediation of internal linking and
ecommerce navigation  
**Audience:** Frontend developer, backend developer, SEO/technical lead,
QA  
**Priority:** High  
**Document status:** Developer implementation brief

## 1\. Project objective

Make the Vibe Music website's navigation and internal-linking system
consistent, functional, crawlable and maintainable.

The work must ensure that:

1. Every navigation item, mega-menu entry, category card, breadcrumb
   and product link has a valid destination.
2. Parent categories, child categories and products are connected
   through stable database relationships.
3. Search returns relevant products when users search by product name,
   SKU, brand, category, subcategory or useful synonyms.
4. Category and product pages use a consistent URL strategy.
5. Previous WordPress URLs are redirected to the correct current pages
   where equivalent pages exist.
6. Search engines can discover important pages through crawlable links
   and XML sitemaps.
7. Broken links, incorrect destinations, duplicate URLs and orphan
   pages are detected and corrected.
8. The existing visual design is preserved unless a change is necessary
   to fix functionality or accessibility.

**Do not redesign the website as part of this task.** Prioritise the
underlying navigation, data relationships, routes, search and SEO
implementation.

\---

## 2\. Evidence and initial observations

The supplied:

- A navigation bar with All Categories, Brands, Cables, Guitars,
  Studio \& Recording, Drums \& Percussion, Keyboards \& Synthesizers,
  Accessories and Grand Piano.
- A Cables mega menu with sections such as Cables, Cases \& Bags and
  Essentials.
- Visible entries including Instrument cables, XLR \& mic cables, Patch
  cables, Power \& adapters, Guitar cases, Keyboard bags, Rack cases,
  Pedalboards, Stands, Tuners \& metronomes and Care \& cleaning.
- A search for `instrument cable` displaying `0 products`.

The initial public-facing review also indicated that cable-related
category/search pages may be reachable through more than one URL
pattern. These patterns must be verified against the current source
code, database and production redirects before implementation.

### 2.1 Key investigation hypothesis

The visible zero-result search, despite an Instrument cables entry in
the mega menu, may be caused by one or more of the following:

- Search only matches an exact phrase or a limited product field.
- Product titles, tags or search keywords do not contain the searched
  phrase.
- Products are assigned to a different category than the one displayed
  in navigation.
- The search API does not include child categories or category names.
- Search indexing is stale or incomplete.
- Active/published/stock filters exclude matching products.
- The frontend sends a different query or parameter than the API
  expects.
- The displayed category link and search index use different category
  identifiers.

\---

## 3\. Scope of work

### In scope

- Header navigation and mega-menu links.
- Category and subcategory data model.
- Product-to-category mapping.
- Category listing pages.
- Product detail routes.
- Breadcrumb generation.
- Search UI and search API.
- Search indexing or database query logic.
- Related category and related product links.
- Canonical URL handling.
- Legacy URL redirects.
- XML sitemap and robots configuration.
- Broken-link and orphan-page checks.
- QA, regression testing and deployment verification.

##

## 4\. Required investigation before coding

The developer must first map how the current website works.

### 4.1 Inspect the project structure

Locate and document the actual files responsible for:

\---

Area Files/components to locate What to inspect

\---

Header Header, Navbar, Navigation data source
MainNavigation and link destinations

Mega menu MegaMenu, CategoryMenu, Whether every item is a
Dropdown real link

All Categories Category drawer/menu Category hierarchy and
URL construction

Category page Category listing Category lookup,
route/page product query and
pagination

Product page Product detail route/page Product slug, ID and
category relationships

Search SearchBar, SearchResults Query parameters,
debounce and result
handling

Search API API Search fields, filters
route/controller/service and response structure

Breadcrumbs Breadcrumb Parent-child resolution
component/helper

Related products RelatedProducts Relationship and link
component/API generation

SEO Metadata helpers/layout Title, description,
canonical and robots
metadata

Sitemap Sitemap route/script Which public pages are
included

Redirects Next.js config, Legacy URL handling
middleware, hosting rules

Data layer Prisma schema/models or Category and product
equivalent relationships
---

Do not assume these filenames exist. Find the real files in the
repository and record their paths.

### 4.2 Trace one complete user journey

Trace this journey from browser to database:

1. User opens the homepage.
2. User opens the Cables mega menu.
3. User clicks Instrument cables.
4. The browser navigates to the category page.
5. The category page requests the relevant category and products.
6. The user opens a product.
7. The product page displays its category breadcrumb.
8. The user clicks the breadcrumb to return to the category.
9. The user searches for `instrument cable`.
10. The search request reaches the API and returns relevant products.

For each step, record:

- Component or route.
- Link `href` or navigation destination.
- API endpoint and request parameters.
- Database query or service used.
- Response status and relevant response fields.
- Any console, network or server error.
- Whether the resulting page is indexable.

This trace should identify the actual point where the connection fails.

\---

## 5\. Target information architecture

Use the existing approved Vibe Music taxonomy as the source of truth.
The structure below is an illustrative example for the Cables navigation.
Do not create duplicate categories if equivalent records already exist.

text
Vibe Music Homepage
|
+-- Accessories
| |
| +-- Cables
| | |
| | +-- Instrument Cables
| | +-- XLR \& Mic Cables
| | +-- Patch Cables
| | +-- Power \& Adapters
| |
| +-- Cases \& Bags
| | +-- Guitar Cases
| | +-- Keyboard Bags
| | +-- Rack Cases
| | +-- Pedalboards
| |
| +-- Essentials
| +-- Stands
| +-- Tuners \& Metronomes
| +-- Care \& Cleaning
|
+-- Guitars
+-- Studio \& Recording
+-- Drums \& Percussion
+-- Keyboards \& Synthesizers
+-- Brands
+-- Grand Piano

````

### 5.1 Navigation relationship rules

* A category can have zero or one parent category unless the current
business model explicitly supports multiple category placements.
* A category can have multiple child categories.
* A product can belong to one primary category and, if the business
requires it, multiple additional categories.
* Category placement must be represented by database relationships,
not inferred only from text labels.
* Menu labels must be sourced from approved category records or an
approved navigation configuration.
* A category must not be displayed as active in the menu if it has no
valid destination.
* A menu entry must not be linked to a generic page simply to make it
clickable.
* Do not use product category names as product names or vice versa.

\---

## 6\. Category and product data model

Use stable IDs for relationships. Do not use category display names as
foreign keys.

The following is an illustrative Prisma-style model. Adapt it to the
actual schema and database. Do not copy it blindly if the project
already has equivalent models.

``` prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: \[parentId], references: \[id])
  children    Category\[] @relation("CategoryTree")
  products    ProductCategory\[]
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Product {
  id          String            @id @default(cuid())
  name        String
  slug        String            @unique
  sku         String?           @unique
  brandId     String?
  isActive    Boolean           @default(true)
  categories  ProductCategory\[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model ProductCategory {
  productId  String
  categoryId String
  isPrimary  Boolean  @default(false)
  product    Product  @relation(fields: \[productId], references: \[id])
  category   Category @relation(fields: \[categoryId], references: \[id])

  @@id(\[productId, categoryId])
  @@index(\[categoryId])
}
````

### 6.1 Data integrity requirements

- Category IDs must be unique and stable.
- Category slugs must be unique within the chosen URL strategy. If
  nested duplicate slugs are allowed, implement a deterministic route
  resolver and enforce uniqueness for the full path.
- Product IDs and product slugs must be stable.
- Product SKU uniqueness rules must match actual business
  requirements.
- A product-category relationship must reference existing records.
- Inactive categories must not appear in public navigation or public
  category sitemaps.
- Products must not be shown in public listings if they are
  unpublished or otherwise not eligible for sale.
- If a product has multiple categories, define one primary category
  for breadcrumbs and canonical product context.
- Prevent circular category relationships.
- Validate that a category cannot be its own parent or a descendant of
  itself.
- Avoid destructive migrations. Back up the database and review
  migration impact before applying changes.

### 6.2 Category versus product

Keep these concepts separate:

- **Product:** A sellable item, such as a particular instrument cable
  model.
- **Category:** A classification used to organise products, such as
  Instrument Cables.
- **Brand:** The manufacturer or brand associated with a product.
- **Navigation item:** A menu entry that points to a category, brand,
  landing page or other approved destination. It is not necessarily a
  database category.

Do not populate a product's category field with its own product title.
Do not create a category for every SKU.

\---

## 7\. URL and route strategy

Choose one canonical URL convention and use it consistently. The
following is a recommended example, subject to review against the
existing production routes and SEO history.

```text
/
 /accessories/
 /accessories/cables/
 /accessories/cables/instrument-cables/
 /accessories/cables/xlr-mic-cables/
 /accessories/cables/patch-cables/
 /accessories/cables/power-adapters/
 /products/{product-slug}/
 /brands/{brand-slug}/
 /search/?q=instrument%20cable
```

The exact route format may differ if the current application already has
a stable, indexed convention. Do not migrate URLs just for stylistic
preference.

### 7.1 Route requirements

- Every public category has one canonical route.
- Every public product has one canonical route.
- Route resolution must use stable slugs or IDs, not display text
  assembled in the browser.
- URL encoding must be correct.
- Trailing slash behaviour must be consistent.
- Case handling must be consistent.
- Invalid or deleted slugs must return a real 404 response, not a 200
  page with an error message.
- Do not expose internal database IDs in public URLs unless this is
  already an intentional convention.
- Route generation must be centralised in reusable helpers rather than
  repeated string concatenation throughout components.

Example helper:

```ts
export function categoryPath(pathSegments: string\[]) {
  return "/" + pathSegments
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join("/") + "/";
}

export function productPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}/`;
}
```

Adapt the helpers to the actual routing convention. Do not encode a
whole URL twice.

### 7.2 Legacy URL redirects

Before implementing redirects:

1. Export or collect known old WordPress URLs.
2. Match each old URL to the most relevant current page.
3. Record the mapping in a redirect inventory.
4. Implement permanent redirects only when the destination is a true
   equivalent.
5. Avoid redirecting every old URL to the homepage.
6. Avoid redirect chains and redirect loops.
7. Return 404 or 410 where a page has genuinely been removed and no
   equivalent exists, following the SEO owner's decision.

Example redirect inventory:

\---

Old URL New URL Status Verified

\---

`/product-category/accessories/cables/` `/accessories/cables/` 301 Pending

## `/product-category/accessories/cables/instrument-cables/` `/accessories/cables/instrument-cables/` 301 Pending

These are examples. Confirm the actual historical URLs and destinations
before publishing redirects.

\---

## 8\. Header and mega-menu implementation

### 8.1 Functional requirements

Every mega-menu item must:

- Be a real anchor link with a valid `href`.
- Navigate to the correct category or approved landing page.
- Work with mouse, keyboard and touch.
- Have a visible focus state.
- Have an accessible name.
- Avoid empty `href`, `#` placeholders and click handlers that do not
  navigate.
- Not point to a category that does not exist or is inactive.
- Preserve the existing visual design and responsive behaviour.

### 8.2 Menu data

Prefer a central menu configuration or data source rather than
hardcoding separate, inconsistent menu structures in multiple
components.

Illustrative configuration:

```ts
type MenuLink = {
  label: string;
  href: string;
  categoryId?: string;
  children?: MenuLink\[];
};

const cablesMenu: MenuLink\[] = \[
  {
    label: "Instrument cables",
    href: "/accessories/cables/instrument-cables/",
    categoryId: "REPLACE\_WITH\_REAL\_CATEGORY\_ID"
  },
  {
    label: "XLR \& mic cables",
    href: "/accessories/cables/xlr-mic-cables/",
    categoryId: "REPLACE\_WITH\_REAL\_CATEGORY\_ID"
  },
  {
    label: "Patch cables",
    href: "/accessories/cables/patch-cables/",
    categoryId: "REPLACE\_WITH\_REAL\_CATEGORY\_ID"
  },
  {
    label: "Power \& adapters",
    href: "/accessories/cables/power-adapters/",
    categoryId: "REPLACE\_WITH\_REAL\_CATEGORY\_ID"
  }
];
```

Replace all placeholder IDs with real IDs. If navigation is generated
from category records, use the central route helper and avoid
duplicating the same category structure in static configuration.

### 8.3 Menu validation

Create a development or automated test that checks:

- Every menu item has a non-empty destination.
- Every internal destination resolves.
- No two menu items unintentionally point to the same unrelated page.
- Inactive categories are excluded.
- No duplicate entries are rendered.
- All links work at desktop, tablet and mobile breakpoints.

\---

## 9\. Search functionality correction

The screenshot shows a search for `instrument cable` returning zero
products. This is the highest-priority user-facing issue to investigate.

### 9.1 Required search behaviour

Search should support relevant matching across:

- Product name/title.
- SKU.
- Brand name.
- Category name.
- Subcategory name.
- Search keywords/tags.
- Approved synonyms and common variations.

Search should not depend only on exact full-title equality.

### 9.2 Search query processing

Recommended processing steps:

1. Trim leading and trailing spaces.
2. Normalise case.
3. Normalise repeated whitespace.
4. Preserve meaningful model numbers, punctuation and SKU characters.
5. Tokenise the query.
6. Apply exact SKU matching where appropriate.
7. Apply title and brand matching.
8. Apply category and subcategory matching.
9. Apply approved synonyms.
10. Rank results by relevance.
11. Apply eligibility filters such as published/active status.
12. Return a consistent response with result count and pagination.

Do not remove punctuation or special characters blindly: product model
numbers may depend on them.

### 9.3 Synonym examples

Create an approved synonym dictionary. These are examples to review, not
automatic assumptions:

Search phrase Possible related terms

\---

instrument cable guitar cable, instrument lead
mic cable microphone cable, XLR cable
patch cable pedal patch cable
power adapter power supply, adapter

Synonyms should improve recall without returning unrelated products.

### 9.4 Search API requirements

The API should:

- Accept a query parameter such as `q`.
- Validate and limit query length.
- Return consistent result fields.
- Return total result count.
- Support pagination.
- Apply the same published/active rules as category listings.
- Avoid exposing unpublished products.
- Use safe parameterised database queries or the ORM.
- Avoid unbounded queries.
- Log errors without logging sensitive information.
- Return an empty result set as a normal response, not as a server
  error.

Illustrative response:

```json
{
  "query": "instrument cable",
  "total": 2,
  "page": 1,
  "pageSize": 24,
  "products": \[
    {
      "id": "PRODUCT\_ID",
      "name": "Example Instrument Cable",
      "slug": "example-instrument-cable",
      "sku": "EXAMPLE-SKU",
      "brand": "Example Brand"
    }
  ]
}
```

This is an example response shape only. Align it with the existing API
contract or version it safely.

### 9.5 Search debugging procedure

For the exact query `instrument cable`:

1. Inspect the browser Network tab.
2. Record the request URL, query string, request method and response.
3. Confirm the frontend sends the expected query.
4. Call the API directly with the same query.
5. Search the database for products with relevant titles, SKUs, tags
   and category assignments.
6. Confirm those products are active and published.
7. Compare the category listing query with the search query.
8. Check whether category IDs or slugs are being passed incorrectly.
9. Check any search index refresh or cache invalidation process.
10. Fix the root cause and add a regression test.

### 9.6 Search acceptance tests

At minimum, test:

- `instrument cable`
- `instrument cables`
- `guitar cable`
- An exact known cable SKU
- A known brand name
- A known product model
- A partial product title
- A query with leading/trailing spaces
- A query with mixed case
- A query with no matching products

Expected behaviour: matching active products appear where they exist;
unrelated products do not appear merely because a broad synonym matched.

\---

## 10\. Category listing page requirements

Each category page must:

- Resolve the correct category record.
- Display the correct category name and description.
- Display products assigned to that category according to approved
  category rules.
- Include child category links where applicable.
- Support pagination or the existing product-loading pattern.
- Support filters and sorting without losing the category context.
- Display a useful empty state if no eligible products exist.
- Avoid showing products from unrelated categories.
- Include breadcrumbs.
- Include relevant metadata and canonical URL.
- Return a genuine 404 for an invalid category slug.

### 10.1 Product assignment rules

Agree on one consistent rule for products assigned to a parent and/or
child category.

For example, if a user visits Cables, the page may show: - Products
directly assigned to Cables; and/or - Products assigned to descendant
categories.

Choose the desired behaviour and implement it consistently across
category pages, search filters, counts and breadcrumbs. Do not assume
that every parent category should automatically include all descendant
products without business approval.

\---

## 11\. Product page and breadcrumb requirements

### 11.1 Product page

Each product page should have:

- A stable product URL.
- Product name and SKU where appropriate.
- Brand link where a valid brand page exists.
- Primary category breadcrumb.
- Relevant related products.
- Relevant category links.
- Correct canonical metadata.
- Correct 404 behaviour for invalid or unavailable products.

### 11.2 Breadcrumb example

```text
Home > Accessories > Cables > Instrument Cables > Product Name
```

Requirements:

- Home links to `/`.
- Each category breadcrumb links to its actual category page.
- The final product name is the current page and need not be a link.
- Breadcrumb hierarchy is generated from database relationships.
- Breadcrumbs must not be manually typed separately for each product.
- If a product belongs to multiple categories, use its designated
  primary category for the canonical breadcrumb.
- Breadcrumb links must not point to stale or legacy routes.

Where appropriate, implement structured data using `BreadcrumbList`
JSON-LD and verify it with Google's Rich Results Test.

\---

## 12\. Related internal links

Add useful, contextually relevant links to strengthen discovery and
navigation.

### Category pages

- Parent category.
- Child categories.
- Related categories.
- Relevant brands, if supported.
- Products within the category.

### Product pages

- Primary category.
- Brand page.
- Related products.
- Relevant accessory or compatible-product category, only where
  compatibility is verified.

### Homepage and landing pages

- Main product categories.
- Important subcategories.
- Featured brands.
- Important promotional or editorial landing pages.

Do not add irrelevant links solely to increase the number of internal
links. Links must help users discover related products and categories.

\---

## 13\. Technical SEO requirements

### 13.1 Metadata

Every indexable category and product page should have:

- Unique title.
- Relevant meta description.
- One clear primary heading.
- Correct canonical URL.
- Appropriate index/follow directives.
- Relevant Open Graph metadata where used.

Avoid duplicate titles and descriptions across all category pages.

### 13.2 Canonical URLs

- Every indexable page should declare its preferred canonical URL.
- Canonicals must point to the final destination, not a redirect.
- Filter, sort and pagination URL rules must be documented.
- Do not canonicalise every category page to the homepage.
- Avoid multiple canonical tags.
- Canonical URL must match the chosen production URL strategy.

### 13.3 XML sitemap

The sitemap should include eligible, canonical, indexable URLs for:

- Homepage.
- Active public category pages.
- Active public product pages.
- Public brand pages.
- Approved SEO landing pages.

Exclude:

- Admin pages.
- Cart, checkout and account pages where they should not be indexed.
- Search-result URLs unless a deliberate SEO strategy says otherwise.
- Noindex pages.
- Duplicate URLs.
- Redirecting URLs.
- 404 pages.
- Unpublished or inactive products/categories.

Update the sitemap when relevant products or categories are created,
changed or removed.

### 13.4 Robots.txt

- Confirm the robots file is accessible.
- Do not block important public category or product pages.
- Do not rely on robots.txt alone to remove URLs from the index.
- Include the correct sitemap location.
- Review any existing staging or development restrictions before
  production deployment.

### 13.5 Structured data

Where relevant, validate:

- BreadcrumbList.
- Product structured data.
- Organization or website structured data already implemented.

Only publish structured data that matches visible page content and real
product data. Do not invent ratings, prices, availability or review
counts.

\---

## 14\. Broken links, orphan pages and crawl audit

Run a crawl of the production website and, if available, the staging
website.

Record:

- Internal links returning 404.
- Internal links returning 5xx.
- Redirect chains.
- Redirect loops.
- Links pointing to the wrong category.
- Duplicate URLs.
- Pages with no internal incoming links.
- Pages with missing or duplicate canonical tags.
- Pages missing titles or primary headings.
- Pages unintentionally marked noindex.
- Sitemap URLs that do not return 200.
- Important public pages missing from the sitemap.

### 14.1 Orphan page definition

An orphan page is an important page with no discoverable internal links
from the website's crawlable navigation or content.

Important products and categories should be reachable through relevant
internal links, not only through a sitemap or external search result.

### 14.2 Crawl report columns

Use a spreadsheet or CSV with these columns:

Column Description

\---

Source URL Page containing the link
Link text Visible link label
Destination URL Target URL
HTTP status Response status
Redirect destination Final URL if redirected
Page type Homepage/category/product/brand/other
Canonical URL Declared canonical
Indexability Index/follow status
Issue Description of problem
Priority Critical/high/medium/low
Fix owner Developer or SEO owner
Status Open/in progress/fixed/retested

\---

## 15\. Performance and implementation considerations

- Avoid fetching the same category data repeatedly in the header, mega
  menu and page body.
- Reuse server-side data access functions where appropriate.
- Avoid sequential requests when independent data can safely be
  fetched in parallel.
- Cache stable category/navigation data appropriately.
- Revalidate or invalidate caches when category relationships change.
- Ensure search results are not stale after product updates.
- Add database indexes for frequently queried fields based on query
  plans and real workload.
- Do not add indexes blindly; inspect database execution plans.
- Avoid loading all products just to filter them in the browser.
- Preserve pagination and reasonable result limits.
- Monitor Core Web Vitals and existing page performance after changes.

Caching must not cause a product or category change to remain invisible
for an unacceptable period.

\---

## 16\. Security and reliability requirements

- Validate route parameters and search input.
- Use parameterised queries or safe ORM operations.
- Do not expose unpublished product data.
- Do not trust category IDs or slugs supplied by the browser without
  server-side validation.
- Avoid leaking internal database errors to public users.
- Keep error logs useful but free of secrets and credentials.
- Do not commit environment variables or API keys.
- Apply database migrations through the project's normal reviewed
  process.
- Take a backup before data corrections or migrations.
- Keep a rollback plan for route and redirect changes.

\---

## 17\. Testing and quality assurance

### 17.1 Functional test matrix

\---

Test Expected result Priority

\---

Click All Categories Correct category High
navigation opens

Click Cables Correct Cables page Critical
opens

Click Instrument cables Correct subcategory Critical
page opens

Click XLR \& mic cables Correct subcategory High
page opens

Click Patch cables Correct subcategory High
page opens

Click Power \& adapters Correct subcategory High
page opens

Search Relevant active Critical
`instrument cable` products appear

Search known cable SKU Correct product appears High

Open a product from Correct product page High
category opens

Click product Correct category page High
breadcrumb opens

Open invalid category Real 404 response High
slug

Open invalid product Real 404 response High
slug

Open old WordPress URL Correct 301 High
destination, if mapped

Open sitemap Valid sitemap with High
eligible URLs

Open mobile mega menu Links work with touch High
and keyboard
---

### 17.2 Automated tests

Where the current stack supports it, add:

- Unit tests for category path generation.
- Unit tests for breadcrumb hierarchy.
- Unit tests for search query normalisation and ranking.
- API integration tests for category and search endpoints.
- End-to-end tests for mega-menu navigation.
- End-to-end tests for search and product opening.
- Redirect tests for mapped legacy URLs.
- Sitemap tests for valid, canonical and indexable URLs.

### 17.3 Regression test data

Use known products from the real Vibe Music catalogue. Do not create
fake production product records to make tests pass.

The developer should identify at least: - Two active instrument cable
products. - One active XLR/microphone cable product. - One known cable
SKU. - One inactive or unpublished product. - One product assigned to a
child category. - One product with multiple category assignments, if the
database supports that case.

\---

## 18\. Recommended implementation phases

### Phase 1 --- Audit and evidence collection

1. Review source code and database schema.
2. Map header, mega-menu and route components.
3. Trace the `instrument cable` search request.
4. Export category and product relationships.
5. Crawl current internal URLs.
6. Collect old WordPress URL patterns.
7. Produce an issue list with evidence and file paths.

**Deliverable:** Technical audit report and agreed implementation plan.

### Phase 2 --- Data and route correction

1. Confirm the approved category hierarchy.
2. Identify duplicate or incorrectly mapped categories.
3. Correct product-category relationships.
4. Centralise route generation.
5. Implement or correct category and product route resolution.
6. Validate all navigation destinations.

**Deliverable:** Verified category/product relationships and working
routes.

### Phase 3 --- Search correction

1. Trace the existing search implementation.
2. Correct query normalisation and matching.
3. Include the approved search fields.
4. Add synonyms only where approved.
5. Correct stale index/cache behaviour if applicable.
6. Add regression tests.

**Deliverable:** Search works for the approved test queries.

### Phase 4 --- Internal linking and SEO

1. Correct mega-menu and category links.
2. Correct breadcrumbs.
3. Add relevant related-category and related-product links.
4. Correct canonical metadata.
5. Implement reviewed legacy redirects.
6. Correct sitemap and robots configuration.
7. Validate structured data.

**Deliverable:** Consistent crawlable internal-linking structure.

### Phase 5 --- QA and release

1. Run functional and automated tests.
2. Crawl staging.
3. Fix remaining broken links and redirect issues.
4. Compare staging with production.
5. Take a production backup.
6. Deploy in a controlled release.
7. Verify the same critical tests in production.
8. Monitor logs, Search Console and crawl results.

**Deliverable:** Production verification report and rollback notes.

\---

## 19\. Priority classification

\---

Priority Work Reason

\---

P0 --- Critical Search returns zero for Directly affects
valid product queries product discovery

P0 --- Critical Navigation links lead Blocks user journeys
to invalid destinations

P0 --- Critical Incorrect Causes wrong listings
product/category and navigation
relationships

P1 --- High Breadcrumbs and Navigation and crawl
category hierarchy clarity

P1 --- High Legacy redirects and Avoids broken
canonical URLs historical URLs and
duplication

P1 --- High Sitemap and Search engine discovery
indexability

P2 --- Medium Related Improves navigation and
product/category links discovery

P2 --- Medium Performance and caching Improves experience and
refinements reliability

P2 --- Medium Additional monitoring Helps prevent
and reporting regressions
---

The developer should adjust priority if source-code investigation
identifies a more severe production issue.

\---

## 20\. Definition of done

The work is not complete until all the following are true:

- \[ ] Every visible header and mega-menu link has a valid, verified
  destination.
- \[ ] The approved category hierarchy is documented and implemented.
- \[ ] Products are linked to the correct category IDs.
- \[ ] Parent and child category behaviour is consistent.
- \[ ] Search for `instrument cable` returns relevant active products
  where such products exist.
- \[ ] Search works for known SKUs and approved brand/product queries.
- \[ ] Product pages open correctly from category and search results.
- \[ ] Breadcrumbs link to the correct category hierarchy.
- \[ ] Invalid category and product routes return genuine 404
  responses.
- \[ ] Legacy URL redirects have been reviewed and tested.
- \[ ] Canonical URLs are correct and consistent.
- \[ ] Sitemap contains eligible canonical public URLs.
- \[ ] No important category or product page is orphaned.
- \[ ] No critical internal 404s, redirect loops or redirect chains
  remain.
- \[ ] Desktop and mobile navigation are tested.
- \[ ] Automated tests pass.
- \[ ] Production verification is complete.
- \[ ] Backup and rollback procedure are documented.

\---

## 21\. Developer handover and reporting format

Before closing the task, provide the following report:

### A. Files changed

File path Change made Reason

\---

To be completed by developer

### B. Database changes

Model/table Change Migration ID Backup verified

\---

To be completed by developer

### C. Routes and redirects

Old URL New URL HTTP status Tested

\---

To be completed by developer

### D. Search test results

Query Expected Actual Pass/fail

\---

instrument cable Relevant cable products  
instrument cables Relevant cable products  
known cable SKU Exact product  
known brand Relevant brand products

### E. Final QA

- Staging URL:
- Production deployment date:
- Tests executed:
- Open issues:
- Known limitations:
- Rollback procedure:
- Developer responsible:
- QA approval:

\---

## 22\. Instructions to the developer

**Please follow this order:**

1. Read the complete document.
2. Inspect the current implementation before editing.
3. Identify the exact cause of the search and internal-linking
   problems.
4. Share the audit findings and affected file paths.
5. Confirm the category hierarchy and URL plan before making structural
   changes.
6. Make changes in a development/staging environment first.
7. Do not delete, rename or recreate categories without approval.
8. Do not change the website's visual design unnecessarily.
9. Do not remove existing URLs without a verified redirect or removal
   plan.
10. Test all navigation, search, product, breadcrumb and SEO behaviour.
11. Provide the completed handover report.

**Final instruction:** Fix the root cause, not just the visible symptom.
The objective is one connected ecommerce structure where navigation,
category records, products, search, breadcrumbs and SEO URLs all use the
same underlying source of truth.
