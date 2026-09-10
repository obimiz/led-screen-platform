import type { LucideIcon } from "lucide-react";
import {
  Bell,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Wrench,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
};

export type AdminNavigationItem = NavigationItem & {
  icon: LucideIcon;
};

export const publicNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "LED Screens", href: "/led-screens" },
  { label: "Accessories", href: "/led-accessories" },
  { label: "Solutions", href: "/#solutions" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export const adminNavigation: AdminNavigationItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "LED Products", href: "/admin/products", icon: Package },
  { label: "LED Accessories", href: "/admin/accessories", icon: Package },
  {
    label: "Product Categories",
    href: "/admin/product-categories",
    icon: Menu,
  },
  {
    label: "Accessory Categories",
    href: "/admin/accessory-categories",
    icon: Menu,
  },
  { label: "Service requests", href: "/admin#services", icon: Wrench },
  { label: "Bell systems", href: "/admin#bell-systems", icon: Bell },
  { label: "Content", href: "/admin#content", icon: Menu },
  {
    label: "Business Settings",
    href: "/admin/settings/business",
    icon: Settings,
  },
];
