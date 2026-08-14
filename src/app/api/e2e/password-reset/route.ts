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
  const capture = getLastE2EResetCapture();
  if (!capture) {
    return NextResponse.json({ error: "No capture" }, { status: 404 });
  }
  return NextResponse.json(capture);
}

export async function DELETE() {
  if (!isE2ETestMode()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  clearE2EResetCapture();
  return NextResponse.json({ ok: true });
}
