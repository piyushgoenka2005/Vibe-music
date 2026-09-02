import AccountOrders from "@/components/account/AccountOrders";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";
import { getSessionUser } from "@/lib/auth/server-session";
import { listOrdersForUser } from "@/lib/server/orderService";

export default async function AccountOrdersPage() {
  return withServerPageError(async () => {
    const sessionUser = await getSessionUser();
    const initialOrders = sessionUser
      ? await listOrdersForUser(sessionUser.uid, sessionUser.email ?? undefined)
      : [];

    return <AccountOrders initialOrders={initialOrders} />;
  }, "Orders");
}
