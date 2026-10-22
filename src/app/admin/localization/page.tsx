"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminFetchJson } from "@/components/admin/AdminQueryState";

export default function AdminLocalizationPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-localization"],
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      const data = adminFetchJson<unknown>(`/api/admin/localization`);
      return <p>Locales: {JSON.stringify(data as unknown as string)}</p>;
    },
  });

  if (isLoading) return <p>Loading localization…</p>;
  if (isError) return <p>Error loading localization</p>;

  return <p>Locales: {JSON.stringify(data)}</p>;
}
