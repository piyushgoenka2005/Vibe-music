import MarkupBlock from "@/components/layout/Header/MarkupBlock";
import { COPYRIGHT_MARKUP } from "./generated/markup";

export default function FooterBottom() {
  return <MarkupBlock html={COPYRIGHT_MARKUP} />;
}
