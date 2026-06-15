import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  createUserAddress,
  getUserAddresses,
} from "@/lib/server/addressService";
import { addressInputSchema } from "@/lib/validations/address";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await getUserAddresses(sessionUser.uid);
    return NextResponse.json({ addresses });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch addresses";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message =
      error instanceof Error ? error.message : "Unable to create address";
    const status = message.includes("required") || message.includes("valid")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
