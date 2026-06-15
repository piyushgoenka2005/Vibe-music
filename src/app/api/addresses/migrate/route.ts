import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { migrateLegacyAddresses } from "@/lib/server/addressService";
import { migrateAddressesSchema } from "@/lib/validations/address";

export async function POST(request: Request) {
  try {
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
    const result = await migrateLegacyAddresses(
      sessionUser.uid,
      legacyAddresses,
      parsed.phone ?? ""
    );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to migrate addresses";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
