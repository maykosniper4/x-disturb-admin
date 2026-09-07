"use client";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";

export type PermissionKey =
  // Zones
  | "zones.view"
  | "zones.create"
  | "zones.edit"
  | "zones.delete"
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.toggle_status"
  // Roles & Permissions
  | "roles.view"
  | "roles.manage"
  // Notifications
  | "notifications.view"
  | "notifications.send"
  // Transactions & Plans
  | "transactions.view"
  | "transactions.export"
  | "plans.manage"
  // Audit Logs
  | "audit.view"
  | "audit.export"
  // Legal & System
  | "legal.edit"
  | "system.settings";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
}

export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "zones",
    label: "Silent Zones & Geofencing",
    description: "Permissions for managing churches, mosques, and libraries",
    permissions: [
      {
        key: "zones.view",
        label: "View Zones",
        description: "View zone catalog and live activity map",
      },
      {
        key: "zones.create",
        label: "Create Zones",
        description: "Add new geofenced silent zones",
      },
      {
        key: "zones.edit",
        label: "Edit Zones",
        description: "Modify boundaries, radius, and zone details",
      },
      {
        key: "zones.delete",
        label: "Delete Zones",
        description: "Permanently remove silent zones from the map",
      },
    ],
  },
  {
    id: "users",
    label: "User Management",
    description: "Permissions for managing user accounts and access",
    permissions: [
      {
        key: "users.view",
        label: "View Users",
        description: "Browse registered users and account details",
      },
      {
        key: "users.create",
        label: "Create / Invite Users",
        description: "Create new user accounts and assigned roles",
      },
      {
        key: "users.edit",
        label: "Edit Users",
        description: "Modify user profile info and assigned groups",
      },
      {
        key: "users.toggle_status",
        label: "Toggle User Status",
        description: "Activate or suspend user access",
      },
      {
        key: "users.delete",
        label: "Delete Users",
        description: "Permanently delete user accounts",
      },
    ],
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    description: "Permissions for governing system roles and access control",
    permissions: [
      {
        key: "roles.view",
        label: "View Roles",
        description: "View role directory and permission matrices",
      },
      {
        key: "roles.manage",
        label: "Manage Roles",
        description: "Create, edit, and delete custom administrative roles",
      },
    ],
  },
  {
    id: "notifications",
    label: "Push Notifications",
    description: "Permissions for messaging and broadcast alerts",
    permissions: [
      {
        key: "notifications.view",
        label: "View Notification History",
        description: "Read sent and scheduled notification logs",
      },
      {
        key: "notifications.send",
        label: "Send & Schedule Alerts",
        description: "Dispatch push notifications to users and groups",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Transactions",
    description: "Permissions for Telebirr payments and subscriptions",
    permissions: [
      {
        key: "transactions.view",
        label: "View Transactions",
        description: "Access payment transaction logs and revenues",
      },
      {
        key: "transactions.export",
        label: "Export Payments",
        description: "Download financial ledgers as Excel/CSV",
      },
      {
        key: "plans.manage",
        label: "Manage Subscription Plans",
        description: "Create, price, and toggle subscription plans",
      },
    ],
  },
  {
    id: "audit",
    label: "Audit Logs & Compliance",
    description: "Permissions for inspecting administrative audit trails",
    permissions: [
      {
        key: "audit.view",
        label: "View Audit Logs",
        description: "Inspect system-wide operator activity logs",
      },
      {
        key: "audit.export",
        label: "Export Audit Logs",
        description: "Download audit trails for compliance audits",
      },
    ],
  },
  {
    id: "system",
    label: "System & Legal",
    description: "Permissions for system configurations and policies",
    permissions: [
      {
        key: "legal.edit",
        label: "Edit Legal Policies",
        description: "Update Data & Security, Privacy, and User Agreement",
      },
      {
        key: "system.settings",
        label: "System Settings",
        description: "Configure system integrations and administrative settings",
      },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_CATEGORIES.flatMap(
  (c) => c.permissions.map((p) => p.key)
);

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color: string;
  permissions: PermissionKey[];
  userCount?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoleInput = Omit<Role, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_ROLES: Role[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Unrestricted access to all modules, roles, and administrative functions.",
    isSystem: true,
    color: "purple",
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: "zone_manager",
    name: "Zone Manager",
    description: "Full management of silent zones, geofences, and real-time activity.",
    isSystem: true,
    color: "blue",
    permissions: [
      "zones.view",
      "zones.create",
      "zones.edit",
      "zones.delete",
      "notifications.view",
      "audit.view",
    ],
  },
  {
    id: "support_admin",
    name: "Support Moderator",
    description: "Handles user accounts, referrals, notifications, and customer inquiries.",
    isSystem: true,
    color: "emerald",
    permissions: [
      "users.view",
      "users.create",
      "users.edit",
      "users.toggle_status",
      "notifications.view",
      "notifications.send",
      "zones.view",
      "audit.view",
    ],
  },
  {
    id: "auditor",
    name: "Auditor & Compliance",
    description: "Read-only access across financial transactions, audit logs, and reports.",
    isSystem: true,
    color: "amber",
    permissions: [
      "audit.view",
      "audit.export",
      "transactions.view",
      "transactions.export",
      "zones.view",
      "users.view",
    ],
  },
  {
    id: "standard_user",
    name: "Standard Operator",
    description: "Basic operational visibility without write privileges.",
    isSystem: true,
    color: "slate",
    permissions: [
      "zones.view",
      "users.view",
      "notifications.view",
      "transactions.view",
    ],
  },
];

const ROLES_COLLECTION = "roles";

export const subscribeToRoles = (
  callback: (roles: Role[]) => void,
  onError?: (err: Error) => void
) => {
  const q = query(collection(db, ROLES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_ROLES);
        return;
      }

      const firestoreRoles: Role[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Role, "id">),
      }));

      // Merge defaults with custom roles ensuring default system roles exist
      const existingIds = new Set(firestoreRoles.map((r) => r.id));
      const missingDefaults = DEFAULT_ROLES.filter((dr) => !existingIds.has(dr.id));
      const allRoles = [...firestoreRoles, ...missingDefaults];

      callback(allRoles);
    },
    onError
  );
};

export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const snap = await getDocs(collection(db, ROLES_COLLECTION));
    if (snap.empty) {
      return DEFAULT_ROLES;
    }
    const firestoreRoles = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Role, "id">),
    })) as Role[];

    const existingIds = new Set(firestoreRoles.map((r) => r.id));
    const missingDefaults = DEFAULT_ROLES.filter((dr) => !existingIds.has(dr.id));
    return [...firestoreRoles, ...missingDefaults];
  } catch (err) {
    console.warn("Could not fetch roles from Firestore, using default system roles:", err);
    return DEFAULT_ROLES;
  }
};

export const createRole = async (
  input: RoleInput
): Promise<{ success: boolean; id: string }> => {
  const docRef = await addDoc(collection(db, ROLES_COLLECTION), {
    ...input,
    isSystem: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { success: true, id: docRef.id };
};

export const updateRole = async (
  id: string,
  input: Partial<RoleInput>
): Promise<{ success: boolean }> => {
  const roleRef = doc(db, ROLES_COLLECTION, id);
  const snap = await getDoc(roleRef);

  if (snap.exists()) {
    await updateDoc(roleRef, {
      ...input,
      updatedAt: Timestamp.now(),
    });
  } else {
    // If updating a default role for the first time, persist to Firestore
    const defaultRole = DEFAULT_ROLES.find((r) => r.id === id);
    if (defaultRole) {
      await setDoc(roleRef, {
        ...defaultRole,
        ...input,
        updatedAt: Timestamp.now(),
      });
    }
  }
  return { success: true };
};

export const deleteRole = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const defaultRole = DEFAULT_ROLES.find((r) => r.id === id);
  if (defaultRole?.isSystem) {
    return { success: false, message: "System roles cannot be deleted." };
  }

  const roleRef = doc(db, ROLES_COLLECTION, id);
  await deleteDoc(roleRef);
  return { success: true };
};
