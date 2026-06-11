"use client";

import MarkupBlock from "./MarkupBlock";
import { ADA_MARKUP } from "./generated/markup";
import { useAdaMenu } from "./hooks/useAdaMenu";

export default function AdaSection() {
  useAdaMenu();
  return <MarkupBlock html={ADA_MARKUP} />;
}
