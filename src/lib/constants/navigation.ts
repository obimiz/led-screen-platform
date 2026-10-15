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
  { label: "Request Quote", href: "/request-quote" },
  { label: "LED Installation", href: "/led-installation" },
  { label: "LED Maintenance", href: "/led-maintenance" },
  { label: "Electronic Bell & Alarm", href: "/electronic-bell-alarm" },
  { label: "Music", href: "/music" },
  { label: "Projects", href: "/projects" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Solutions", href: "/#solutions" },
];

export const adminNavigation: AdminNavigationItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
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
  { label: "Sales · Enquiries", href: "/admin/sales/enquiries", icon: Package },
  {
    label: "Sales · Quotations",
    href: "/admin/sales/quotations",
    icon: Package,
  },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Contact Enquiries", href: "/admin/enquiries", icon: Package },
  { label: "Notifications", href: "/admin/notifications", icon: Package },
  { label: "Payments", href: "/admin/payments", icon: Package },
  {
    label: "Rentals · Requests",
    href: "/admin/rentals/requests",
    icon: Package,
  },
  {
    label: "Rentals · Bookings",
    href: "/admin/rentals/bookings",
    icon: Package,
  },
  { label: "Rentals · Calendar", href: "/admin/rentals/calendar", icon: Menu },
  {
    label: "Installations · Requests",
    href: "/admin/installations/requests",
    icon: Wrench,
  },
  {
    label: "Installations · Assessments",
    href: "/admin/installations/assessments",
    icon: Wrench,
  },
  {
    label: "Installations · Projects",
    href: "/admin/installations/projects",
    icon: Wrench,
  },
  {
    label: "Installations · Schedule",
    href: "/admin/installations/schedule",
    icon: Wrench,
  },
  {
    label: "Maintenance · Requests",
    href: "/admin/maintenance/requests",
    icon: Wrench,
  },
  {
    label: "Maintenance · Jobs",
    href: "/admin/maintenance/jobs",
    icon: Wrench,
  },
  {
    label: "Maintenance · Schedule",
    href: "/admin/maintenance/schedule",
    icon: Wrench,
  },
  {
    label: "Bell & Alarm · Products",
    href: "/admin/bell-alarm/products",
    icon: Bell,
  },
  {
    label: "Bell & Alarm · Accessories",
    href: "/admin/bell-alarm/accessories",
    icon: Bell,
  },
  {
    label: "Bell & Alarm · Requests",
    href: "/admin/bell-alarm/requests",
    icon: Bell,
  },
  { label: "Music & Audio", href: "/admin/music", icon: Menu },
  { label: "Music · Categories", href: "/admin/music/categories", icon: Menu },
  { label: "Music · Artists", href: "/admin/music/artists", icon: Menu },
  { label: "Portfolio · Projects", href: "/admin/portfolio", icon: Menu },
  {
    label: "Portfolio · Categories",
    href: "/admin/portfolio/categories",
    icon: Menu,
  },
  { label: "Gallery", href: "/admin/gallery", icon: Menu },
  {
    label: "Gallery · Categories",
    href: "/admin/gallery/categories",
    icon: Menu,
  },
  { label: "Organisations", href: "/admin/organisations", icon: Menu },
  { label: "Testimonials", href: "/admin/testimonials", icon: Menu },
  { label: "Service requests", href: "/admin#services", icon: Wrench },
  { label: "Bell systems", href: "/admin#bell-systems", icon: Bell },
  { label: "Content", href: "/admin#content", icon: Menu },
  {
    label: "Business Settings",
    href: "/admin/settings/business",
    icon: Settings,
  },
];
