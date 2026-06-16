import "./auth.css";

interface AuthPageLayoutProps {
  children: React.ReactNode;
  wide?: boolean;
}

/** Centers auth forms within the Sweetwater-style homepage wrapper. */
export default function AuthPageLayout({
  children,
  wide = false,
}: AuthPageLayoutProps) {
  return (
    <main className="storefront-page storefront-page--subtle auth-page" id="main-content">
      <div
        className={`auth-page__content${wide ? " auth-page__content--wide" : ""}`}
      >
        {children}
      </div>
    </main>
  );
}
