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

  it("renders correct buttons and active state for page 1 of 7", () => {
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
    // Pages 2 and 7 are rendered with ellipsis in between
    expect(html).toContain('aria-label="Page 2"');
    expect(html).toContain("…");
    expect(html).toContain('aria-label="Page 7"');
  });

  it("renders correct buttons and active state for page 2 of 7", () => {
    const html = renderToStaticMarkup(
      <CategoryPagination page={2} totalPages={7} onPageChange={() => {}} />,
    );
    // Prev button enabled
    expect(html).not.toContain('disabled="" aria-label="Previous page"');
    // Page 2 is active
    expect(html).toContain('aria-label="Page 2" aria-current="page"');
    // Page 1 and 3 are present
    expect(html).toContain('aria-label="Page 1"');
    expect(html).toContain('aria-label="Page 3"');
    expect(html).toContain('aria-label="Page 7"');
  });

  it("renders correct buttons and active state for page 7 of 7", () => {
    const html = renderToStaticMarkup(
      <CategoryPagination page={7} totalPages={7} onPageChange={() => {}} />,
    );
    // Next button disabled on page 7
    expect(html).toContain('disabled="" aria-label="Next page"');
    // Page 7 is active
    expect(html).toContain('aria-label="Page 7" aria-current="page"');
    // Page 1 and 6 are present
    expect(html).toContain('aria-label="Page 1"');
    expect(html).toContain('aria-label="Page 6"');
  });
});
