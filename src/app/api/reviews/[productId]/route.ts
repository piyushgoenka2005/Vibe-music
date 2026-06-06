import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const db = getAdminFirestore();
    const snap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .get();
    const reviews = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const db = getAdminFirestore();
    const ref = await db.collection("reviews").add({
      productId,
      author: String(body.author ?? "Guest"),
      rating: Number(body.rating ?? 5),
      title: String(body.title ?? ""),
      body: String(body.body ?? ""),
      verifiedPurchase: Boolean(body.verifiedPurchase),
      date: new Date().toISOString().slice(0, 10),
    });
    return NextResponse.json({ id: ref.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
