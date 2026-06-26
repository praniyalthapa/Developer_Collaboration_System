import type { IconName } from "./icons";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/feed", label: "Discover", icon: "compass" },
  { to: "/connections", label: "Connections", icon: "users" },
  { to: "/requests", label: "Requests", icon: "inbox" },
  { to: "/sent", label: "Sent", icon: "send" },
  { to: "/admin", label: "Admin", icon: "shield", adminOnly: true },
];
