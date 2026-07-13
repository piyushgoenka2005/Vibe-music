import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy Sweetwater-style path → canonical rentals landing. */
export default function InstrumentRentalsRedirect() {
  redirect(ROUTES.rentals);
}
