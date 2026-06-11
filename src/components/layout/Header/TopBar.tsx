import MarkupBlock from "./MarkupBlock";
import { TOP_BAR_MARKUP } from "./generated/markup";

export default function TopBar() {
  return <MarkupBlock html={TOP_BAR_MARKUP} />;
}
