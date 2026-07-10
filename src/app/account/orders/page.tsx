import AccountOrders from "@/components/account/AccountOrders";
import { getSessionUser } from "@/lib/auth/server-session";
import { listOrdersForUser } from "@/lib/server/orderService";

export default async function AccountOrdersPage() {
  const sessionUser = await getSessionUser();
  const initialOrders = sessionUser
    ? await listOrdersForUser(sessionUser.uid, sessionUser.email ?? undefined)
    : [];

  return <AccountOrders initialOrders={initialOrders} />;
}
