import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listInventory,
  adjustStock,
  listAdjustments,
  getInventoryStats,
} from "@/lib/server/inventoryService";
import { adminInventoryAdjustSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("inventory:read");
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "adjustments") {
      const adjustments = await listAdjustments();
      return NextResponse.json({ adjustments });
    }
    const [inventory, stats] = await Promise.all([
      listInventory(),
      getInventoryStats(),
    ]);
    return NextResponse.json({ inventory, stats });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("inventory:write");
    const body = await request.json();
    const parsed = adminInventoryAdjustSchema.parse(body);
    const adjustment = await adjustStock(
      parsed.productId,
      parsed.newQuantity,
      parsed.reason,
      admin.email
    );
    return NextResponse.json({ adjustment });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
