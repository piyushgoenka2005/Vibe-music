"use client";

import { useEffect, useRef } from "react";
import { GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useCompareStore } from "@/store/compareStore";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types/product";

interface CompareButtonProps {
  product: Product;
  size?: number;
  className?: string;
}

export default function CompareButton({
  product,
  size = 18,
  className = "",
}: CompareButtonProps) {
  const router = useRouter();
  const isCompared = useCompareStore((s) => s.has(product.id));
  const add = useCompareStore((s) => s.add);
  const remove = useCompareStore((s) => s.remove);
  const showToast = useToastStore((s) => s.show);
  const btnRef = useRef<HTMLButtonElement>(null);
  const prevCompared = useRef(isCompared);

  useEffect(() => {
    if (prevCompared.current === isCompared) return;

    const node = btnRef.current;
    if (!node) return;

    node.classList.remove("compare-btn--pop");
    void node.offsetWidth;
    node.classList.add("compare-btn--pop");

    const timer = window.setTimeout(() => {
      node.classList.remove("compare-btn--pop");
    }, 420);

    prevCompared.current = isCompared;
    return () => window.clearTimeout(timer);
  }, [isCompared]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`compare-btn${isCompared ? " compare-btn--active" : ""} ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCompared) {
          remove(product.id);
          showToast("Removed from compare", "info");
          return;
        }

        const added = add(product);
        if (!added) {
          showToast("Compare list is full (max 4 products)", "error");
          return;
        }

        showToast("Added to compare", "success");
        router.prefetch(ROUTES.compare);
      }}
      aria-pressed={isCompared}
      aria-label={
        isCompared
          ? `Remove ${product.name} from compare`
          : `Add ${product.name} to compare`
      }
    >
      <GitCompare size={size} />
    </button>
  );
}
