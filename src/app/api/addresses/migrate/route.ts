import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { migrateLegacyAddresses } from "@/lib/server/addressService";
import { migrateAddressesSchema } from "@/lib/validations/address";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "addresses-migrate", RATE_LIMITS.auth);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = migrateAddressesSchema.parse(body);
    const legacyAddresses = parsed.addresses.map((addr, index) => ({
      id: addr.id ?? `legacy-${index}`,
      label: addr.label ?? "Home",
      name: addr.name,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault ?? false,
    }));
    const result = await migrateLegacyAddresses(sessionUser.uid, legacyAddresses, parsed.phone ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return publicApiError(error, "Unable to migrate addresses");
  }
}
