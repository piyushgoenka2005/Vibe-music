import {
  LayoutDashboard,
  Package,
  Heart,
  User,
  MapPin,
  Settings,
  Bell,
  Headset,
  LogOut,
  Gift,
  CalendarDays,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export const ACCOUNT_NAV_ITEMS = [
  {
    href: ROUTES.account,
    label: "Overview",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    href: ROUTES.accountOrders,
    label: "Orders",
    icon: Package,
    mobile: true,
  },
  {
    href: ROUTES.accountWishlist,
    label: "Wishlist",
    icon: Heart,
    mobile: true,
  },
  {
    href: ROUTES.accountRentals,
    label: "Rentals",
    icon: CalendarDays,
    mobile: true,
  },
  {
    href: ROUTES.accountGiveaways,
    label: "Giveaways",
    icon: Gift,
    mobile: true,
  },
  {
    href: ROUTES.accountProfile,
    label: "Profile",
    icon: User,
    mobile: true,
  },
  {
    href: ROUTES.accountAddresses,
    label: "Addresses",
    icon: MapPin,
    mobile: true,
  },
  {
    href: ROUTES.accountNotifications,
    label: "Notifications",
    icon: Bell,
    mobile: true,
  },
  {
    href: ROUTES.accountSupport,
    label: "Support",
    icon: Headset,
    mobile: true,
  },
  {
    href: ROUTES.accountSettings,
    label: "Settings",
    icon: Settings,
    mobile: true,
  },
] as const;

export const ACCOUNT_LOGOUT = {
  label: "Logout",
  icon: LogOut,
} as const;
