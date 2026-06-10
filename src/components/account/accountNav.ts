import {
  LayoutDashboard,
  Package,
  Heart,
  User,
  MapPin,
  Settings,
  LogOut,
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
    href: ROUTES.accountProfile,
    label: "Profile",
    icon: User,
    mobile: true,
  },
  {
    href: ROUTES.accountAddresses,
    label: "Addresses",
    icon: MapPin,
    mobile: false,
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
