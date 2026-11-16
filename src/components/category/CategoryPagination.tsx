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

  const handlePage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageItems = (): Array<number | "ellipsis"> => {
    // If 7 or fewer pages, display all pages so 1, 2, 3, 4, 5, 6, 7 are directly clickable without ellipsis
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [];

    if (page <= 4) {
      // Near start: 1, 2, 3, 4, 5, …, totalPages
      for (let i = 1; i <= 5; i++) items.push(i);
      items.push("ellipsis");
      items.push(totalPages);
    } else if (page >= totalPages - 3) {
      // Near end: 1, …, totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
      items.push(1);
      items.push("ellipsis");
      for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
    } else {
      // Middle: 1, …, page-1, page, page+1, …, totalPages
      items.push(1);
      items.push("ellipsis");
      items.push(page - 1);
      items.push(page);
      items.push(page + 1);
      items.push("ellipsis");
      items.push(totalPages);
    }

    return items;
  };

  const items = getPageItems();

  return (
    <nav className="cat-pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => handlePage(page - 1)}
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
            onClick={() => handlePage(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => handlePage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
