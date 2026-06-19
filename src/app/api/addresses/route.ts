import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  createUserAddress,
  getUserAddresses,
} from "@/lib/server/addressService";
import { addressInputSchema } from "@/lib/validations/address";

function formatRouteError(error: unknown): { message: string; status: number } {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(" ");
    return { message, status: 400 };
  }

  const message =
    error instanceof Error ? error.message : "Unable to complete request";
  const status =
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("Invalid")
      ? 400
      : 500;
  return { message, status };
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await getUserAddresses(sessionUser.uid);
    return NextResponse.json({ addresses });
  } catch (error) {
    const { message, status } = formatRouteError(error);
    return NextResponse.json({ error: message }, { status });
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
    const { message, status } = formatRouteError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
