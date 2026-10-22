"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminFetchJson } from "@/components/admin/AdminQueryState";

export default function AdminAttributesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-attributes"],
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      const data = adminFetchJson<unknown>(`/api/admin/attributes`);
      return <p>Attributes: {JSON.stringify(data as unknown as string)}</p>;
    },
  });

  if (isLoading) return <p>Loading attributes…</p>;
  if (isError) return <p>Error loading attributes</p>;

  return <p>Attributes: {JSON.stringify(data)}</p>;
}
