"use client";

interface CategoryPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CategoryPagination({
  page,
  totalPages,
  onPageChange,
}: CategoryPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const items: Array<number | "ellipsis"> = [];
  pages.forEach((p, index) => {
    if (index > 0 && p - pages[index - 1] > 1) items.push("ellipsis");
    items.push(p);
  });

  return (
    <nav className="cat-pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e-${index}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={item === page ? "cat-pagination__btn--active" : ""}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
