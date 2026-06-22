import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";

/** @deprecated Addresses are stored in Firestore. Kept for localStorage migration only. */
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
  notifications: NotificationPreferences;
}

interface AccountProfileState extends AccountProfileExtras {
  _hydrated: boolean;
  setPhone: (phone: string) => void;
  setDateOfBirth: (dateOfBirth: string) => void;
  updateNotifications: (patch: Partial<NotificationPreferences>) => void;
  _setHydrated: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  orderUpdates: true,
  promotions: false,
  productAlerts: true,
  newsletter: false,
};

export const useAccountProfileStore = create<AccountProfileState>()(
  persist(
    (set) => ({
      phone: "",
      dateOfBirth: "",
      notifications: DEFAULT_NOTIFICATIONS,
      _hydrated: false,

      _setHydrated: () => set({ _hydrated: true }),

      setPhone: (phone) => set({ phone }),

      setDateOfBirth: (dateOfBirth) => set({ dateOfBirth }),

      updateNotifications: (patch) => {
        set((state) => ({
          notifications: { ...state.notifications, ...patch },
        }));
      },
    }),
    {
      name: "vibe-account-profile",
      storage: createSafeJSONStorage(),
      partialize: (state) => ({
        phone: state.phone,
        dateOfBirth: state.dateOfBirth,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    }
  )
);
