import AccountOverview from "@/components/account/AccountOverview";
import { getSessionUser } from "@/lib/auth/server-session";
import { loadAccountReferralCoupon } from "@/lib/server/coupons/loadAccountReferralCoupon";

export default async function AccountPage() {
  const sessionUser = await getSessionUser();
  const initialReferral = await loadAccountReferralCoupon(sessionUser);

  return <AccountOverview initialReferral={initialReferral} />;
}
