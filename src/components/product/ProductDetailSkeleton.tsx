export default function ProductDetailSkeleton() {
  return (
    <div className="pdp" aria-busy="true" aria-label="Loading product">
      <div className="pdp-skeleton pdp-skeleton--line" style={{ width: 240 }} />
      <div className="pdp-main">
        <div className="pdp-skeleton pdp-skeleton--gallery" />
        <div>
          <div className="pdp-skeleton pdp-skeleton--line" style={{ width: 100 }} />
          <div className="pdp-skeleton pdp-skeleton--title" />
          <div className="pdp-skeleton pdp-skeleton--line" style={{ width: 120 }} />
          <div className="pdp-skeleton pdp-skeleton--line" style={{ width: 180 }} />
          <div className="pdp-skeleton pdp-skeleton--price" />
          <div
            className="pdp-skeleton pdp-skeleton--line"
            style={{ width: "100%", height: 48, marginTop: 20 }}
          />
          <div
            className="pdp-skeleton pdp-skeleton--line"
            style={{ width: "100%", height: 48, marginTop: 10 }}
          />
        </div>
      </div>
      <div
        className="pdp-skeleton pdp-skeleton--line"
        style={{ width: "100%", height: 48, marginBottom: 20 }}
      />
      <div className="pdp-skeleton pdp-skeleton--line" style={{ width: "100%", height: 200 }} />
    </div>
  );
}
