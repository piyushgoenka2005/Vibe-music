"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminFetchJson } from "@/components/admin/AdminQueryState";

export default function AdminMediaPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-media"],
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      const data = adminFetchJson<unknown>(`/api/admin/media`);
      return <p>Media items: {JSON.stringify(data as unknown as string)}</p>;
    },
  });

  if (isLoading) return <p>Loading media…</p>;
  if (isError) return <p>Error loading media</p>;

  return <p>Media items: {JSON.stringify(data)}</p>;
}
