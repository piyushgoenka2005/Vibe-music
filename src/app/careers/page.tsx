import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function CareersRedirectPage() {
  redirect(ROUTES.page("careers"));
}
