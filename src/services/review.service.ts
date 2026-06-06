import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type { ProductReview } from "@/types/product";

const REVIEWS = "reviews";

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, REVIEWS),
    where("productId", "==", productId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductReview, "id">),
  }));
}

export async function submitProductReview(input: {
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase?: boolean;
}): Promise<void> {
  const db = getClientFirestore();
  await addDoc(collection(db, REVIEWS), {
    ...input,
    date: new Date().toISOString().slice(0, 10),
  });
}
