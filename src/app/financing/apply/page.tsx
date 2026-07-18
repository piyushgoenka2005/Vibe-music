import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function FinancingApplyPage() {
  redirect(ROUTES.financing);
}
