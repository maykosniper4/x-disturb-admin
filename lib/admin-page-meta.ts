export interface AdminPageBreadcrumb {
  label: string;
  href?: string;
}

export interface AdminPageMeta {
  title: string;
  description: string;
  backHref?: string;
  breadcrumbs?: AdminPageBreadcrumb[];
}

const adminPageMetaByPath: Record<string, AdminPageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description:
      "Real-time overview of zone activity, users, and revenue.",
  },
  "/dashboard/silent-zones": {
    title: "Silent Zones",
    description:
      "Manage geographical areas with restricted activity. View zones in list or map form and add new zones as needed.",
  },
  "/dashboard/silent-zones/new-zone": {
    title: "Create New Silent Zone",
    description: "Define a geographical area with restricted activity.",
    backHref: "/dashboard/silent-zones",
    breadcrumbs: [
      { label: "Silent Zones", href: "/dashboard/silent-zones" },
      { label: "Create Zone" },
    ],
  },
  "/dashboard/silent-zones/edit-zone": {
    title: "Edit Silent Zone",
    description: "Update zone boundaries, type, and activity restrictions.",
    backHref: "/dashboard/silent-zones",
    breadcrumbs: [
      { label: "Silent Zones", href: "/dashboard/silent-zones" },
      { label: "Edit Zone" },
    ],
  },
  "/dashboard/real-time-activity": {
    title: "Real-time Activity",
    description:
      "Live updates of user locations and activities within designated zones.",
  },
  "/dashboard/users-management": {
    title: "Users Management",
    description:
      "Search, filter, and manage user accounts, roles, and access status.",
  },
  "/dashboard/roles-permissions": {
    title: "Roles & Permissions",
    description:
      "Configure administrative roles, assign granular permissions, and control access across modules.",
  },
  "/dashboard/audit-logs": {
    title: "Audit Logs",
    description:
      "Inspect historical operator actions, security events, and administrative changes with detailed filtering.",
  },
  "/dashboard/transactions": {
    title: "Telebirr Transactions",
    description:
      "View and manage telebirr payment transactions, monitor subscriptions, and handle invoicing.",
  },
  "/dashboard/subscription-plans": {
    title: "Subscription Plans",
    description: "Manage pricing plans shown to users in the X-Disturb app.",
  },
  "/dashboard/reports": {
    title: "Reports",
    description:
      "Access detailed analytics for user growth, zone activity and payment transactions for informed decision making.",
  },
  "/dashboard/push-notification": {
    title: "Push Notifications",
    description:
      "Send targeted notifications to users by category, referral code, or all users.",
  },
  "/dashboard/referral-management": {
    title: "Referral Code Management",
    description:
      "Create, edit, and manage referral codes and their associated user groups.",
  },
  "/dashboard/profile": {
    title: "My Profile",
    description:
      "Manage your administrator account settings and preferences.",
  },
  "/dashboard/notifications": {
    title: "Notifications",
    description: "View and manage all system notifications.",
  },
};

const dynamicRoutes: { pattern: RegExp; meta: AdminPageMeta }[] = [
  {
    pattern: /^\/dashboard\/users-management\/[^/]+$/,
    meta: {
      title: "Manage User",
      description: "Update account details, role, and access status.",
      backHref: "/dashboard/users-management",
      breadcrumbs: [
        { label: "Users", href: "/dashboard/users-management" },
        { label: "Edit User" },
      ],
    },
  },
];

export function getAdminPageMeta(pathname: string): AdminPageMeta | null {
  if (adminPageMetaByPath[pathname]) {
    return adminPageMetaByPath[pathname];
  }

  for (const route of dynamicRoutes) {
    if (route.pattern.test(pathname)) {
      return route.meta;
    }
  }

  return null;
}

export function getDashboardPageDescription(isDemo: boolean): string {
  return isDemo
    ? "Overview with sample metrics for preview and demos."
    : "Real-time overview of zone activity, users, and revenue.";
}
