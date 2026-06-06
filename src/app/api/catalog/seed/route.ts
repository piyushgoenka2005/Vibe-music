import { NextResponse } from "next/server";
import { PRODUCTS } from "@/data/products";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST() {
  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    PRODUCTS.forEach((product) => {
      const ref = db.collection("products").doc(product.id);
      batch.set(ref, product, { merge: true });
    });
    await batch.commit();
    return NextResponse.json({ seeded: PRODUCTS.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
