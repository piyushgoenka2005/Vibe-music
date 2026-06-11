"use client";

import { useEffect } from "react";
import AdaSection from "./AdaSection";
import TopBar from "./TopBar";
import MainNav from "./MainNav";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import MarkupBlock from "./MarkupBlock";
import { ASSETS_HEADER_CLOSE_MARKUP, HEADER_TAIL_MARKUP } from "./generated/markup";
import { useHeaderNav } from "./hooks/useHeaderNav";

export default function Header() {
  useHeaderNav();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vibe:header-ready"));
  }, []);

  return (
    <div data-vibe-section="header" className="vibe-html-section">
      <AdaSection />
      <TopBar />
      <MainNav />
      <SearchBar />
      <MegaMenu />
      <MarkupBlock html={ASSETS_HEADER_CLOSE_MARKUP} />
      <MobileMenu />
      <MarkupBlock html={HEADER_TAIL_MARKUP} />
    </div>
  );
}
