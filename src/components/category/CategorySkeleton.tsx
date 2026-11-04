import "@/components/category/category.css";
import "@/components/filters/filters.css";

export default function CategorySkeleton() {
  return (
    <div className="cat-page cat-page--skeleton" aria-busy="true" aria-label="Loading category">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
        <div
          className="page-skeleton__line page-skeleton__line--short"
          style={{ width: 140, height: 14 }}
        />
      </div>

      <div
        className="page-skeleton__line page-skeleton__line--title"
        style={{ width: 220, height: 36, margin: "8px 0 12px" }}
      />
      <div
        className="page-skeleton__line page-skeleton__line--short"
        style={{ width: 360, height: 14, marginBottom: 28 }}
      />

      <div
        className="cat-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div className="page-skeleton__line" style={{ width: 120, height: 20 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div
            className="page-skeleton__line"
            style={{ width: 100, height: 36, borderRadius: 6 }}
          />
          <div className="page-skeleton__line" style={{ width: 72, height: 36, borderRadius: 6 }} />
        </div>
      </div>

      <div className="cat-page__layout cat-page__layout--rail-external">
        <div className="cat-product-grid cat-product-grid--grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="cat-product-card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--border-default, #e5e7eb)",
                background: "var(--surface-base, #fff)",
                minHeight: "360px",
              }}
            >
              <div
                className="page-skeleton__line"
                style={{
                  width: "100%",
                  height: "200px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              />
              <div
                className="page-skeleton__line"
                style={{ width: "50%", height: "12px", marginBottom: "8px" }}
              />
              <div
                className="page-skeleton__line"
                style={{ width: "90%", height: "16px", marginBottom: "12px" }}
              />
              <div
                className="page-skeleton__line"
                style={{ width: "40%", height: "20px", marginTop: "auto" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
