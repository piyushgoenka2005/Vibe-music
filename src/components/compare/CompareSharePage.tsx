"use client";

import { useQuery } from "@tanstack/react-query";
import ComparePage from "@/components/compare/ComparePage";
import type { CompareItem } from "@/store/compareStore";

export default function CompareSharePage({ token }: { token: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["compare-share", token],
    queryFn: async () => {
      const res = await fetch(`/api/compare/share/${token}`);
      if (!res.ok) throw new Error("Shared compare not found");
      return res.json() as Promise<{ share: { items: CompareItem[] } }>;
    },
  });

  if (isLoading) {
    return (
      <main className="storefront-page compare-page">
        <h1 className="storefront-page__title">Shared product comparison</h1>
        <p>Loading shared comparison…</p>
      </main>
    );
  }

  if (error || !data?.share.items.length) {
    return (
      <main className="storefront-page compare-page">
        <h1 className="storefront-page__title">Shared product comparison</h1>
        <p>Shared comparison not found or expired.</p>
      </main>
    );
  }

  return (
    <ComparePage
      initialItems={data.share.items}
      sharedTitle="Shared product comparison"
      readOnly
    />
  );
}
