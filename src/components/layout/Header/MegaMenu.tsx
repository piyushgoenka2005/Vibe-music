import MarkupBlock from "./MarkupBlock";
import { MEGA_MENU_MARKUP } from "./generated/markup";

export default function MegaMenu() {
  return <MarkupBlock html={MEGA_MENU_MARKUP} />;
}
