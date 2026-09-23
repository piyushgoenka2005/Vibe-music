import { getCachedSocialRailConfig } from "@/lib/server/socialRailSnapshotCache";
import SocialRailGate from "@/components/layout/SocialRailGate";

export default async function SocialRailShell() {
  const config = await getCachedSocialRailConfig();
  return <SocialRailGate config={config} />;
}
