import { NextResponse } from "next/server";

interface CreatePaymentBody {
  orderId: string;
  amount: number;
  currency?: string;
  email?: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePaymentBody;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        demo: true,
        orderId: body.orderId,
      });
    }

    const amount = Math.max(100, body.amount ?? 0);
    const currency = body.currency ?? "INR";

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: body.orderId,
        notes: {
          orderId: body.orderId,
          email: body.email,
          name: body.name,
        },
      }),
    });

    const data = (await response.json()) as { id?: string; error?: { description?: string } };
    if (!response.ok || !data.id) {
      return NextResponse.json(
        { error: data.error?.description ?? "Unable to create Razorpay order" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      key: keyId,
      razorpayOrderId: data.id,
      amount,
      currency,
      orderId: body.orderId,
    });
  } catch {
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
