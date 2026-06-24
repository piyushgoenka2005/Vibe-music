import { PageLoadSplashScreen } from "@/components/layout/PageLoadSplash";

export default function Loading() {
  return (
    <div className="page-load-splash-host" style={{ position: "relative", minHeight: "50vh" }}>
      <PageLoadSplashScreen variant="inline" settled />
    </div>
  );
}
