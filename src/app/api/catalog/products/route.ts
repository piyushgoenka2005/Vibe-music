import { NextResponse } from "next/server";
import { PRODUCTS } from "@/data/products";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("products").get();
    if (snap.empty) {
      return NextResponse.json({ products: PRODUCTS, source: "static" });
    }
    const products = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<(typeof PRODUCTS)[0], "id">),
    }));
    return NextResponse.json({ products, source: "firestore" });
  } catch {
    return NextResponse.json({ products: PRODUCTS, source: "static-fallback" });
  }
}
