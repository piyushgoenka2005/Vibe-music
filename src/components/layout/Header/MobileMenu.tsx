"use client";

import { Menu } from "lucide-react";

export default function MobileMenu() {
  return (
    <button className="lg:hidden">
      <Menu className="w-7 h-7" />
    </button>
  );
}