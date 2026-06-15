import type { LegacySavedAddress } from "@/types/address";
import { migrateLegacyAddresses } from "@/services/addressService";

const PROFILE_STORAGE_KEY = "vibe-account-profile";
const MIGRATION_FLAG_KEY = "vibe-addresses-migrated";

interface StoredProfile {
  state?: {
    addresses?: LegacySavedAddress[];
    phone?: string;
  };
}

function readLegacyAddresses(): {
  addresses: LegacySavedAddress[];
  phone: string;
} {
  if (typeof window === "undefined") {
    return { addresses: [], phone: "" };
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { addresses: [], phone: "" };

    const parsed = JSON.parse(raw) as StoredProfile;
    return {
      addresses: parsed.state?.addresses ?? [],
      phone: parsed.state?.phone ?? "",
    };
  } catch {
    return { addresses: [], phone: "" };
  }
}

function clearLegacyAddressesFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as StoredProfile;
    if (!parsed.state) return;

    parsed.state.addresses = [];
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export async function migrateLocalAddressesIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(MIGRATION_FLAG_KEY) === "done") return;

  const { addresses, phone } = readLegacyAddresses();
  if (addresses.length === 0) {
    sessionStorage.setItem(MIGRATION_FLAG_KEY, "done");
    return;
  }

  try {
    await migrateLegacyAddresses({ addresses, phone });
    clearLegacyAddressesFromStorage();
    sessionStorage.setItem(MIGRATION_FLAG_KEY, "done");
  } catch (error) {
    console.error("[addresses] Migration failed:", error);
  }
}

export function resetAddressMigrationFlag(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MIGRATION_FLAG_KEY);
}
