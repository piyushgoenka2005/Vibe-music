import Link from "next/link";
import { ROUTES } from "@/lib/routes";

interface CategoryBreadcrumbProps {
  categoryName: string;
}

export default function CategoryBreadcrumb({
  categoryName,
}: CategoryBreadcrumbProps) {
  return (
    <nav className="cat-breadcrumb" aria-label="Breadcrumb">
      <Link href={ROUTES.home}>Home</Link>
      <span className="cat-breadcrumb__sep" aria-hidden="true">
        /
      </span>
      <Link href={ROUTES.search}>Browse</Link>
      <span className="cat-breadcrumb__sep" aria-hidden="true">
        /
      </span>
      <span aria-current="page">{categoryName}</span>
    </nav>
  );
}
