import { NextResponse } from "next/server";
import {
  clearE2EResetCapture,
  getLastE2EResetCapture,
  isE2ETestMode,
} from "@/lib/server/e2eResetCapture";

export async function GET() {
  if (!isE2ETestMode()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const capture = getLastE2EResetCapture();
    if (!capture) {
      return NextResponse.json({ error: "No capture" }, { status: 404 });
    }
    return NextResponse.json(capture);
  } catch (error) {
    console.error("[api/e2e/password-reset] GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  if (!isE2ETestMode()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    clearE2EResetCapture();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/e2e/password-reset] DELETE Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
