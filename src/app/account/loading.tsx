import "@/components/account/account.css";

export default function AccountLoading() {
  return (
    <div className="acct" aria-busy="true" aria-label="Loading account dashboard">
      <div className="acct__page">
        <header className="acct__hero" aria-hidden>
          <div className="acct__hero-content">
            <div className="acct__hero-copy">
              <div
                className="page-skeleton__line page-skeleton__line--title"
                style={{ maxWidth: 220, background: "rgba(255, 255, 255, 0.18)" }}
              />
              <div
                className="page-skeleton__line page-skeleton__line--short"
                style={{ maxWidth: 360, background: "rgba(255, 255, 255, 0.12)" }}
              />
            </div>
            <div
              className="acct__hero-avatar"
              style={{ background: "rgba(255, 255, 255, 0.15)" }}
            />
          </div>
        </header>

        <div className="acct__layout">
          <aside className="acct__sidebar" aria-hidden>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 8 }}>
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="page-skeleton__line"
                  style={{ height: 36, margin: 0 }}
                />
              ))}
            </div>
          </aside>

          <div className="acct__main" aria-hidden>
            <div
              className="page-skeleton__line page-skeleton__line--title"
              style={{ maxWidth: 160, marginBottom: 8 }}
            />
            <div
              className="page-skeleton__line page-skeleton__line--short"
              style={{ maxWidth: 280, marginBottom: 24 }}
            />

            <div className="acct__stats">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="acct__stat-card" style={{ pointerEvents: "none" }}>
                  <div
                    className="page-skeleton__line"
                    style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12 }}
                  />
                  <div
                    className="page-skeleton__line page-skeleton__line--short"
                    style={{ height: 14, marginBottom: 8 }}
                  />
                  <div
                    className="page-skeleton__line page-skeleton__line--title"
                    style={{ height: 24, width: "50%" }}
                  />
                </div>
              ))}
            </div>

            <div className="acct__card" style={{ padding: 24, marginBottom: 24 }}>
              <div
                className="page-skeleton__line page-skeleton__line--short"
                style={{ height: 20, marginBottom: 12 }}
              />
              <div className="page-skeleton__line" style={{ height: 44 }} />
            </div>

            <div className="acct__grid-2">
              <div className="acct__card" style={{ padding: 24, minHeight: 220 }}>
                <div
                  className="page-skeleton__line page-skeleton__line--title"
                  style={{ height: 20, width: "40%", marginBottom: 20 }}
                />
                <div className="page-skeleton__line" style={{ height: 48, marginBottom: 12 }} />
                <div className="page-skeleton__line" style={{ height: 48 }} />
              </div>
              <div className="acct__card" style={{ padding: 24, minHeight: 220 }}>
                <div
                  className="page-skeleton__line page-skeleton__line--title"
                  style={{ height: 20, width: "40%", marginBottom: 20 }}
                />
                <div className="page-skeleton__line" style={{ height: 48, marginBottom: 12 }} />
                <div className="page-skeleton__line" style={{ height: 48 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
