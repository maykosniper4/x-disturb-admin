import {
  Home,
  MapPin,
  Clock,
  Users,
  FileText,
  Receipt,
  Bell,
  KeyIcon,
  CreditCard,
  BarChart3,
  ShieldCheck,
  History,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: Home, path: "/dashboard" }],
  },
  {
    label: "Zones & Activity",
    items: [
      { label: "Silent Zones", icon: MapPin, path: "/dashboard/silent-zones" },
      {
        label: "Real Time Activity",
        icon: Clock,
        path: "/dashboard/real-time-activity",
      },
    ],
  },
  {
    label: "Users & Security",
    items: [
      {
        label: "Users Management",
        icon: Users,
        path: "/dashboard/users-management",
      },
      {
        label: "Roles & Permissions",
        icon: ShieldCheck,
        path: "/dashboard/roles-permissions",
      },
      {
        label: "Audit Logs",
        icon: History,
        path: "/dashboard/audit-logs",
      },
    ],
  },
  {
    label: "Billing & Plans",
    items: [
      { label: "Transactions", icon: Receipt, path: "/dashboard/transactions" },
      {
        label: "Subscription Plans",
        icon: CreditCard,
        path: "/dashboard/subscription-plans",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", icon: FileText, path: "/dashboard/reports" },
      { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    ],
  },
  {
    label: "Engagement",
    items: [
      {
        label: "Push Notification",
        icon: Bell,
        path: "/dashboard/push-notification",
      },
      {
        label: "Referrals",
        icon: KeyIcon,
        path: "/dashboard/referral-management",
      },
    ],
  },
];

export const adminNavRoutes: AdminNavItem[] = adminNavGroups.flatMap(
  (group) => group.items
);

export function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(itemPath);
}

export function isNavGroupActive(pathname: string, group: AdminNavGroup): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item.path));
}
