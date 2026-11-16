import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CategoryPagination from "./CategoryPagination";

describe("CategoryPagination", () => {
  it("renders null when totalPages is 1 or less", () => {
    const html1 = renderToStaticMarkup(
      <CategoryPagination page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(html1).toBe("");

    const html0 = renderToStaticMarkup(
      <CategoryPagination page={1} totalPages={0} onPageChange={() => {}} />,
    );
    expect(html0).toBe("");
  });

  it("renders all pages 1 through 7 without ellipsis when totalPages is 7", () => {
    const html = renderToStaticMarkup(
      <CategoryPagination page={1} totalPages={7} onPageChange={() => {}} />,
    );
    expect(html).toContain('aria-label="Pagination"');
    // Prev button disabled on page 1
    expect(html).toContain('disabled="" aria-label="Previous page"');
    // Next button enabled
    expect(html).toContain('aria-label="Next page"');
    // Page 1 is active
    expect(html).toContain('class="cat-pagination__btn--active"');
    expect(html).toContain('aria-label="Page 1" aria-current="page"');
    // All pages 1..7 rendered directly so user can click any page
    for (let p = 1; p <= 7; p++) {
      expect(html).toContain(`aria-label="Page ${p}"`);
    }
    // No ellipsis because all 7 pages are visible
    expect(html).not.toContain("…");
  });

  it("renders correct buttons and active state for page 2 of 7", () => {
    const html = renderToStaticMarkup(
      <CategoryPagination page={2} totalPages={7} onPageChange={() => {}} />,
    );
    // Prev button enabled
    expect(html).not.toContain('disabled="" aria-label="Previous page"');
    // Page 2 is active
    expect(html).toContain('aria-label="Page 2" aria-current="page"');
    // All pages 1..7 present
    for (let p = 1; p <= 7; p++) {
      expect(html).toContain(`aria-label="Page ${p}"`);
    }
    expect(html).not.toContain("…");
  });

  it("renders correct buttons and active state for page 7 of 7", () => {
    const html = renderToStaticMarkup(
      <CategoryPagination page={7} totalPages={7} onPageChange={() => {}} />,
    );
    // Next button disabled on page 7
    expect(html).toContain('disabled="" aria-label="Next page"');
    // Page 7 is active
    expect(html).toContain('aria-label="Page 7" aria-current="page"');
    // All pages 1..7 present
    for (let p = 1; p <= 7; p++) {
      expect(html).toContain(`aria-label="Page ${p}"`);
    }
    expect(html).not.toContain("…");
  });

  it("renders sliding window with ellipsis when totalPages > 7", () => {
    // Near start: 1, 2, 3, 4, 5, …, 10
    const htmlStart = renderToStaticMarkup(
      <CategoryPagination page={1} totalPages={10} onPageChange={() => {}} />,
    );
    expect(htmlStart).toContain("…");
    expect(htmlStart).toContain('aria-label="Page 1"');
    expect(htmlStart).toContain('aria-label="Page 5"');
    expect(htmlStart).toContain('aria-label="Page 10"');
    expect(htmlStart).not.toContain('aria-label="Page 6"');

    // Middle: 1, …, 5, 6, 7, …, 10
    const htmlMid = renderToStaticMarkup(
      <CategoryPagination page={6} totalPages={10} onPageChange={() => {}} />,
    );
    expect(htmlMid).toContain('aria-label="Page 1"');
    expect(htmlMid).toContain('aria-label="Page 5"');
    expect(htmlMid).toContain('aria-label="Page 6" aria-current="page"');
    expect(htmlMid).toContain('aria-label="Page 7"');
    expect(htmlMid).toContain('aria-label="Page 10"');

    // Near end: 1, …, 6, 7, 8, 9, 10
    const htmlEnd = renderToStaticMarkup(
      <CategoryPagination page={10} totalPages={10} onPageChange={() => {}} />,
    );
    expect(htmlEnd).toContain('aria-label="Page 1"');
    expect(htmlEnd).toContain('aria-label="Page 6"');
    expect(htmlEnd).toContain('aria-label="Page 10" aria-current="page"');
  });
});
