import CategorySkeleton from "@/components/category/CategorySkeleton";

export default function CategoryLoading() {
  return (
    <main className="storefront-page" style={{ minHeight: "75vh" }}>
      <CategorySkeleton />
    </main>
  );
}
