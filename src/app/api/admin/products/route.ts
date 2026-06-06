import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Product } from "@/types/product";

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("products").get();
    const products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Product;
    const db = getAdminFirestore();
    const id = body.id || db.collection("products").doc().id;
    await db.collection("products").doc(id).set(body, { merge: true });
    return NextResponse.json({ id, product: body });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
