import MarkupBlock from "./MarkupBlock";
import { MOBILE_SEARCH_MARKUP } from "./generated/markup";

export default function MobileMenu() {
  return <MarkupBlock html={MOBILE_SEARCH_MARKUP} />;
}
