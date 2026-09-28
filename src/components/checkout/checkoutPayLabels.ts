import type { OnlinePaymentChannel } from "@/components/checkout/CheckoutPaymentMethods";

export function getPanelPayLabel(channel: OnlinePaymentChannel): string {
  switch (channel) {
    case "upi":
      return "Pay with UPI";
    case "card":
      return "Pay with Card";
    case "netbanking":
      return "Pay with Net Banking";
    default:
      return "Pay with Razorpay";
  }
}

export function getSwipePayLabel(channel?: OnlinePaymentChannel): string {
  switch (channel) {
    case "upi":
      return "Swipe to Pay with UPI";
    case "card":
      return "Swipe to Pay with Card";
    case "netbanking":
      return "Swipe to Pay with Net Banking";
    default:
      return "Swipe to Pay";
  }
}
