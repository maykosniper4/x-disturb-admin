"use client";

import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import { session } from "@/lib/sessionStorage";
import { isDashboardDemoEnabled } from "@/lib/dashboard-demo-data";

export type AuditActionType =
  // User Actions
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_STATUS_TOGGLED"
  // Role Actions
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "ROLE_PERMISSIONS_CHANGED"
  // Zone Actions
  | "ZONE_CREATED"
  | "ZONE_UPDATED"
  | "ZONE_DELETED"
  // Notification Actions
  | "NOTIFICATION_SENT"
  | "NOTIFICATION_SCHEDULED"
  // Billing Actions
  | "PLAN_CREATED"
  | "PLAN_UPDATED"
  | "PLAN_DELETED"
  // System & Security Actions
  | "LEGAL_DOC_UPDATED"
  | "LOGIN_SUCCESS"
  | "DATA_EXPORTED";

export type AuditCategory =
  | "users"
  | "zones"
  | "roles"
  | "notifications"
  | "billing"
  | "system";

export type AuditStatusTone = "success" | "warning" | "danger" | "info";

export interface AuditLog {
  id: string;
  action: AuditActionType;
  actionLabel: string;
  category: AuditCategory;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  status: AuditStatusTone;
  timestamp: Date;
}

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  users: "Users",
  zones: "Silent Zones",
  roles: "Roles & Permissions",
  notifications: "Notifications",
  billing: "Billing & Plans",
  system: "System & Policies",
};

export const ACTION_LABELS: Record<AuditActionType, string> = {
  USER_CREATED: "Created User Account",
  USER_UPDATED: "Updated User Profile",
  USER_DELETED: "Deleted User Account",
  USER_STATUS_TOGGLED: "Toggled Account Status",
  ROLE_CREATED: "Created Role",
  ROLE_UPDATED: "Updated Role",
  ROLE_DELETED: "Deleted Role",
  ROLE_PERMISSIONS_CHANGED: "Modified Role Permissions",
  ZONE_CREATED: "Created Silent Zone",
  ZONE_UPDATED: "Updated Silent Zone",
  ZONE_DELETED: "Deleted Silent Zone",
  NOTIFICATION_SENT: "Sent Push Notification",
  NOTIFICATION_SCHEDULED: "Scheduled Notification",
  PLAN_CREATED: "Created Subscription Plan",
  PLAN_UPDATED: "Updated Subscription Plan",
  PLAN_DELETED: "Deleted Subscription Plan",
  LEGAL_DOC_UPDATED: "Updated Legal Policy",
  LOGIN_SUCCESS: "Admin Logged In",
  DATA_EXPORTED: "Exported Dataset",
};

const AUDIT_LOGS_COLLECTION = "audit_logs";

export const SAMPLE_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-01",
    action: "ZONE_CREATED",
    actionLabel: "Created Silent Zone",
    category: "zones",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "Silent Zone",
    targetId: "zone-889",
    targetName: "St. George Orthodox Church",
    details: "Established 250m radius geofence with auto-silence audio mode.",
    metadata: { radius: 250, coordinates: { lat: 9.0345, lng: 38.7521 } },
    status: "success",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
  },
  {
    id: "audit-02",
    action: "USER_STATUS_TOGGLED",
    actionLabel: "Toggled Account Status",
    category: "users",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "User",
    targetId: "user-441",
    targetName: "Henok Tadesse",
    details: "Suspended user account due to multiple device integrity alerts.",
    metadata: { previousStatus: true, newStatus: false },
    status: "warning",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
  },
  {
    id: "audit-03",
    action: "ROLE_PERMISSIONS_CHANGED",
    actionLabel: "Modified Role Permissions",
    category: "roles",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "Role",
    targetId: "support_admin",
    targetName: "Support Moderator",
    details: "Added permission 'users.create' and revoked 'system.settings'.",
    metadata: { added: ["users.create"], removed: ["system.settings"] },
    status: "info",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
  },
  {
    id: "audit-04",
    action: "NOTIFICATION_SENT",
    actionLabel: "Sent Push Notification",
    category: "notifications",
    actorId: "admin-102",
    actorName: "Kena Operator",
    actorEmail: "kena@xdisturb.et",
    targetType: "Push Notification",
    targetId: "notif-902",
    targetName: "Addis Prayer Times Alert",
    details: "Broadcasted silent zone reminder to 3,210 active devices in Addis Ababa.",
    metadata: { audience: "all", recipientCount: 3210 },
    status: "success",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000), // 5 hours ago
  },
  {
    id: "audit-05",
    action: "DATA_EXPORTED",
    actionLabel: "Exported Dataset",
    category: "billing",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "Transactions Ledger",
    targetId: "tx-export-01",
    targetName: "Monthly Telebirr Ledger (ETB)",
    details: "Exported 342 payment intent transaction records to Excel (.xlsx).",
    metadata: { format: "xlsx", rows: 342 },
    status: "info",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
  },
  {
    id: "audit-06",
    action: "LEGAL_DOC_UPDATED",
    actionLabel: "Updated Legal Policy",
    category: "system",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "Legal Document",
    targetId: "data_and_security",
    targetName: "Data & Security Policy",
    details: "Updated TLS 1.3 in-transit encryption and zero-knowledge geofence clause.",
    metadata: { sectionsModified: 2 },
    status: "warning",
    timestamp: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
  },
  {
    id: "audit-07",
    action: "USER_DELETED",
    actionLabel: "Deleted User Account",
    category: "users",
    actorId: "admin-101",
    actorName: "Beredin Admin",
    actorEmail: "admin@xdisturb.et",
    targetType: "User",
    targetId: "user-912",
    targetName: "Spam Test Account",
    details: "Permanently purged test account from database per operator request.",
    metadata: { purgeReason: "operator_cleanup" },
    status: "danger",
    timestamp: new Date(Date.now() - 72 * 3600 * 1000), // 3 days ago
  },
];

export interface LogAuditParams {
  action: AuditActionType;
  category: AuditCategory;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  status?: AuditStatusTone;
}

export const logAuditEvent = async (params: LogAuditParams): Promise<void> => {
  try {
    const user = auth.currentUser;
    const actorId = user?.uid || session.getItem("userId") || "admin_user";
    const actorEmail = user?.email || "admin@xdisturb.et";
    const actorName = user?.displayName || user?.email?.split("@")[0] || "Administrator";

    const payload = {
      action: params.action,
      actionLabel: ACTION_LABELS[params.action] || params.action,
      category: params.category,
      actorId,
      actorName,
      actorEmail,
      targetType: params.targetType,
      targetId: params.targetId || "",
      targetName: params.targetName || "",
      details: params.details,
      metadata: params.metadata || {},
      status: params.status || "info",
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), payload);
  } catch (err) {
    // Non-blocking: Audit logger should never break critical user workflows
    console.warn("Failed to write to audit_logs collection:", err);
  }
};

export const subscribeToAuditLogs = (
  callback: (logs: AuditLog[]) => void,
  maxRecords = 150
) => {
  const isDemo = isDashboardDemoEnabled();
  if (isDemo) {
    callback(SAMPLE_AUDIT_LOGS);
    return () => {};
  }

  try {
    const q = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(maxRecords)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(SAMPLE_AUDIT_LOGS);
          return;
        }

        const logs: AuditLog[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          let date = new Date();
          if (d.timestamp instanceof Timestamp) {
            date = d.timestamp.toDate();
          } else if (d.timestamp?.seconds) {
            date = new Date(d.timestamp.seconds * 1000);
          }

          return {
            id: doc.id,
            action: d.action as AuditActionType,
            actionLabel: d.actionLabel || ACTION_LABELS[d.action as AuditActionType] || d.action,
            category: (d.category as AuditCategory) || "system",
            actorId: d.actorId || "unknown",
            actorName: d.actorName || "System Operator",
            actorEmail: d.actorEmail || "operator@xdisturb.et",
            targetType: d.targetType || "General",
            targetId: d.targetId,
            targetName: d.targetName,
            details: d.details || "",
            metadata: d.metadata || {},
            status: (d.status as AuditStatusTone) || "info",
            timestamp: date,
          };
        });

        callback(logs);
      },
      (err) => {
        console.warn("Error listening to audit logs, falling back to sample logs:", err);
        callback(SAMPLE_AUDIT_LOGS);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to audit logs:", err);
    callback(SAMPLE_AUDIT_LOGS);
    return () => {};
  }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const snap = await getDocs(
      query(
        collection(db, AUDIT_LOGS_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(100)
      )
    );
    if (snap.empty) return SAMPLE_AUDIT_LOGS;

    return snap.docs.map((doc) => {
      const d = doc.data();
      let date = new Date();
      if (d.timestamp instanceof Timestamp) {
        date = d.timestamp.toDate();
      } else if (d.timestamp?.seconds) {
        date = new Date(d.timestamp.seconds * 1000);
      }

      return {
        id: doc.id,
        action: d.action as AuditActionType,
        actionLabel: d.actionLabel || ACTION_LABELS[d.action as AuditActionType] || d.action,
        category: (d.category as AuditCategory) || "system",
        actorId: d.actorId || "unknown",
        actorName: d.actorName || "System Operator",
        actorEmail: d.actorEmail || "operator@xdisturb.et",
        targetType: d.targetType || "General",
        targetId: d.targetId,
        targetName: d.targetName,
        details: d.details || "",
        metadata: d.metadata || {},
        status: (d.status as AuditStatusTone) || "info",
        timestamp: date,
      };
    });
  } catch (err) {
    console.warn("Failed to fetch audit logs, using sample logs:", err);
    return SAMPLE_AUDIT_LOGS;
  }
};
