import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  productAlerts: boolean;
  newsletter: boolean;
}

export interface AccountProfileExtras {
  phone: string;
  dateOfBirth: string;
  addresses: SavedAddress[];
  notifications: NotificationPreferences;
}

interface AccountProfileState extends AccountProfileExtras {
  _hydrated: boolean;
  setPhone: (phone: string) => void;
  setDateOfBirth: (dateOfBirth: string) => void;
  addAddress: (address: Omit<SavedAddress, "id">) => void;
  updateAddress: (id: string, patch: Partial<SavedAddress>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateNotifications: (patch: Partial<NotificationPreferences>) => void;
  _setHydrated: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  orderUpdates: true,
  promotions: false,
  productAlerts: true,
  newsletter: false,
};

function createAddressId(): string {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAccountProfileStore = create<AccountProfileState>()(
  persist(
    (set, get) => ({
      phone: "",
      dateOfBirth: "",
      addresses: [],
      notifications: DEFAULT_NOTIFICATIONS,
      _hydrated: false,

      _setHydrated: () => set({ _hydrated: true }),

      setPhone: (phone) => set({ phone }),

      setDateOfBirth: (dateOfBirth) => set({ dateOfBirth }),

      addAddress: (address) => {
        const id = createAddressId();
        const isFirst = get().addresses.length === 0;
        set((state) => ({
          addresses: [
            ...state.addresses,
            {
              ...address,
              id,
              isDefault: address.isDefault ?? isFirst,
            },
          ],
        }));
      },

      updateAddress: (id, patch) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, ...patch } : addr
          ),
        }));
      },

      removeAddress: (id) => {
        set((state) => {
          const next = state.addresses.filter((addr) => addr.id !== id);
          if (next.length > 0 && !next.some((a) => a.isDefault)) {
            next[0] = { ...next[0]!, isDefault: true };
          }
          return { addresses: next };
        });
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          })),
        }));
      },

      updateNotifications: (patch) => {
        set((state) => ({
          notifications: { ...state.notifications, ...patch },
        }));
      },
    }),
    {
      name: "vibe-account-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phone: state.phone,
        dateOfBirth: state.dateOfBirth,
        addresses: state.addresses,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    }
  )
);
