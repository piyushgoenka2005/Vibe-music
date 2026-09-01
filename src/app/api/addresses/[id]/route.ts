import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  deleteUserAddress,
  getUserAddress,
  setUserDefaultAddress,
  updateUserAddress,
} from "@/lib/server/addressService";
import { addressInputSchema } from "@/lib/validations/address";
import { publicApiError } from "@/lib/server/publicApiError";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const rl = await enforceRateLimit(request, "addresses-id", RATE_LIMITS.auth);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const address = await getUserAddress(sessionUser.uid, id);

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    return publicApiError(error, "Unable to fetch address");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (body.isDefault === true && Object.keys(body).length === 1) {
      const address = await setUserDefaultAddress(sessionUser.uid, id);
      return NextResponse.json({ address });
    }

    const input = addressInputSchema.partial().parse(body);
    const address = await updateUserAddress(sessionUser.uid, id, input);
    return NextResponse.json({ address });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update address";
    const status =
      message === "Address not found"
        ? 404
        : message.includes("required") || message.includes("valid")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteUserAddress(sessionUser.uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete address";
    const status = message === "Address not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
