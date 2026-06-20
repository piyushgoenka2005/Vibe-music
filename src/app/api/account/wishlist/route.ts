import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { jsonError } from "@/lib/api/route-utils";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { tryFirestoreFast } from "@/lib/server/firestoreErrors";

const COLLECTION = "wishlists";

export interface WishlistItemRecord {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  imageColor: string;
  image: string;
  addedAt: number;
}

function normalizeItems(raw: unknown): WishlistItemRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is WishlistItemRecord =>
      item != null &&
      typeof item === "object" &&
      typeof (item as WishlistItemRecord).productId === "string"
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const items = await tryFirestoreFast(
    async () => {
      const doc = await getAdminFirestore()
        .collection(COLLECTION)
        .doc(user.uid)
        .get();
      return normalizeItems(doc.data()?.items);
    },
    {
      domain: "wishlist",
      context: "Unable to fetch account wishlist — returning empty list",
      fallback: () => [],
    }
  );

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const body = (await request.json()) as { items?: WishlistItemRecord[] };
  const items = normalizeItems(body.items);

  await tryFirestoreFast(
    async () => {
      await getAdminFirestore()
        .collection(COLLECTION)
        .doc(user.uid)
        .set(
          {
            userId: user.uid,
            items,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
    },
    {
      domain: "wishlist",
      context: "Unable to save account wishlist — skipping remote sync",
      fallback: () => undefined,
    }
  );

  return NextResponse.json({ items });
}
