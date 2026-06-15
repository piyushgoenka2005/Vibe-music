"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { migrateLocalAddressesIfNeeded } from "@/lib/address/migrateLocalAddresses";
import { useAuthStore } from "@/store/authStore";
import {
  createAddress as createAddressApi,
  deleteAddress as deleteAddressApi,
  fetchAddresses,
  setDefaultAddress as setDefaultAddressApi,
  updateAddress as updateAddressApi,
} from "@/services/addressService";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";

const QUERY_KEY = ["addresses"] as const;

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAddresses,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    void migrateLocalAddressesIfNeeded().then(() => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });
  }, [isAuthenticated, queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateAddressInput) => createAddressApi(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      addressId,
      input,
    }: {
      addressId: string;
      input: UpdateAddressInput;
    }) => updateAddressApi(addressId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => deleteAddressApi(addressId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) => setDefaultAddressApi(addressId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const addresses = query.data ?? [];
  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return {
    addresses,
    defaultAddress,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
    setDefaultAddress: setDefaultMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Address };
