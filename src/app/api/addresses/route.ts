import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  createUserAddress,
  getUserAddresses,
} from "@/lib/server/addressService";
import { addressInputSchema } from "@/lib/validations/address";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await getUserAddresses(sessionUser.uid);
    return NextResponse.json(
      { addresses },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return publicApiError(error, "Unable to load addresses");
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = addressInputSchema.parse(body);
    const address = await createUserAddress(sessionUser.uid, input);

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return publicApiError(error, "Unable to save address");
  }
}
