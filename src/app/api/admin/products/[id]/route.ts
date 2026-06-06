import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getAdminFirestore();
    await db.collection("products").doc(id).set(body, { merge: true });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getAdminFirestore();
    await db.collection("products").doc(id).delete();
    return NextResponse.json({ deleted: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
