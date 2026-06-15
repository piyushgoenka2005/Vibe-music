import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  deleteUserAddress,
  getUserAddress,
  setUserDefaultAddress,
  updateUserAddress,
} from "@/lib/server/addressService";
import { addressInputSchema } from "@/lib/validations/address";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
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
    const message =
      error instanceof Error ? error.message : "Unable to fetch address";
    return NextResponse.json({ error: message }, { status: 500 });
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

export async function DELETE(_request: Request, context: RouteContext) {
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
