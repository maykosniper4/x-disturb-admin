"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  subscribeToRoles,
  createRole,
  updateRole,
  deleteRole,
  PERMISSION_CATEGORIES,
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  type Role,
  type RoleInput,
  type PermissionKey,
} from "@/app/api/roles-api";
import { useFetchUsers } from "@/app/api/user-management-api";
import { logAuditEvent } from "@/app/api/audit-logs-api";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { AdminPageHeaderActions } from "@/components/admin/admin-page-header-provider";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Shield,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

const COLOR_OPTIONS = [
  { value: "purple", label: "Purple", class: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300" },
  { value: "blue", label: "Blue", class: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { value: "amber", label: "Amber", class: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "rose", label: "Rose", class: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300" },
  { value: "slate", label: "Slate", class: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300" },
];

const emptyRoleForm = (): RoleInput => ({
  name: "",
  description: "",
  isSystem: false,
  color: "blue",
  permissions: [],
});

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const { users } = useFetchUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleInput>(emptyRoleForm());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRoles(
      (data) => {
        setRoles(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to roles:", err);
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, []);

  const usersCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const r = u.role || "Standard Operator";
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [users]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData(emptyRoleForm());
    setModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      color: role.color || "blue",
      permissions: [...role.permissions],
    });
    setModalOpen(true);
  };

  const togglePermission = (key: PermissionKey) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(key);
      const permissions = exists
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions };
    });
  };

  const toggleCategoryPermissions = (
    categoryPermissions: PermissionKey[],
    allSelected: boolean
  ) => {
    setFormData((prev) => {
      if (allSelected) {
        // Remove all in category
        return {
          ...prev,
          permissions: prev.permissions.filter(
            (p) => !categoryPermissions.includes(p)
          ),
        };
      } else {
        // Add all in category
        const set = new Set([...prev.permissions, ...categoryPermissions]);
        return { ...prev, permissions: Array.from(set) };
      }
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [...ALL_PERMISSIONS],
    }));
  };

  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Role name is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        await logAuditEvent({
          action: "ROLE_UPDATED",
          category: "roles",
          targetType: "Role",
          targetId: editingRole.id,
          targetName: formData.name,
          details: `Updated role '${formData.name}' with ${formData.permissions.length} permissions.`,
          status: "info",
        });
        toast.success(`Role '${formData.name}' updated successfully.`);
      } else {
        const res = await createRole(formData);
        await logAuditEvent({
          action: "ROLE_CREATED",
          category: "roles",
          targetType: "Role",
          targetId: res.id,
          targetName: formData.name,
          details: `Created new custom role '${formData.name}' with ${formData.permissions.length} permissions.`,
          status: "success",
        });
        toast.success(`Role '${formData.name}' created successfully.`);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving role:", err);
      toast.error("Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      toast.warning("System roles are protected and cannot be deleted.");
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete role '${role.name}'? This action cannot be undone.`
      )
    ) {
      const res = await deleteRole(role.id);
      if (res.success) {
        await logAuditEvent({
          action: "ROLE_DELETED",
          category: "roles",
          targetType: "Role",
          targetId: role.id,
          targetName: role.name,
          details: `Deleted custom role '${role.name}'.`,
          status: "danger",
        });
        toast.success(`Role '${role.name}' deleted.`);
      } else {
        toast.error(res.message || "Failed to delete role.");
      }
    }
  };

  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;

  return (
    <AdminPageContent wide className="space-y-6">
      <AdminPageHeaderActions>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5"
          onClick={handleOpenCreate}
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Role</span>
        </Button>
      </AdminPageHeaderActions>

      {/* KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Configured Roles"
          value={roles.length.toString()}
          icon={ShieldCheck}
          loading={loading}
        />
        <AdminStatCard
          title="System Protected Roles"
          value={systemRolesCount.toString()}
          icon={Lock}
          loading={loading}
        />
        <AdminStatCard
          title="Custom Organization Roles"
          value={customRolesCount.toString()}
          icon={Shield}
          loading={loading}
        />
        <AdminStatCard
          title="Granular Permissions"
          value={ALL_PERMISSIONS.length.toString()}
          icon={Layers}
          loading={loading}
        />
      </div>

      {/* Roles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="admin-section-title">Roles & Access Directory</h2>
            <p className="admin-section-desc">
              Manage permission matrices governing operations across silent zones, users, billing, and system policies.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const assignedUsers =
              usersCountByRole[role.name] ||
              usersCountByRole[role.id] ||
              0;

            const categoryBreakdown = PERMISSION_CATEGORIES.map((cat) => {
              const catKeys = cat.permissions.map((p) => p.key);
              const grantedCount = role.permissions.filter((p) =>
                catKeys.includes(p)
              ).length;
              return {
                category: cat.label,
                grantedCount,
                totalCount: catKeys.length,
              };
            }).filter((b) => b.grantedCount > 0);

            return (
              <Card
                key={role.id}
                className="flex flex-col border-border shadow-sm transition-all hover:shadow-md"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {role.isSystem ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {role.name}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {assignedUsers} {assignedUsers === 1 ? "user" : "users"} assigned
                        </span>
                      </div>
                    </div>

                    <AdminStatusBadge
                      label={role.isSystem ? "System" : "Custom"}
                      tone={role.isSystem ? "info" : "brand"}
                    />
                  </div>
                  <CardDescription className="text-xs leading-relaxed line-clamp-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pt-1">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs font-medium text-foreground pb-2 border-b border-border/40">
                      <span>Granted Permissions</span>
                      <span className="tabular-nums font-semibold text-primary">
                        {role.permissions.length} / {ALL_PERMISSIONS.length}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {categoryBreakdown.length > 0 ? (
                        categoryBreakdown.map((b) => (
                          <span
                            key={b.category}
                            className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-[11px] font-medium border border-border text-muted-foreground"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            {b.category}: {b.grantedCount}/{b.totalCount}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No permissions assigned
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleOpenEdit(role)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Configure Matrix</span>
                  </Button>

                  {!role.isSystem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteRole(role)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>Delete</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Role Configuration Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `Configure Role: ${editingRole.name}` : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              Assign module-level rights and operations for this administrative role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g. Zone Inspector"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-color">Visual Color Tag</Label>
                <select
                  id="role-color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-description">Role Description</Label>
              <Textarea
                id="role-description"
                placeholder="Explain the scope and responsibilities granted to users with this role…"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Permission Matrix */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Permission Matrix
                  </h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {formData.permissions.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map((category) => {
                  const catKeys = category.permissions.map((p) => p.key);
                  const isAllCategorySelected = catKeys.every((k) =>
                    formData.permissions.includes(k)
                  );

                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border border-border bg-card p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {category.label}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-primary hover:text-primary/80"
                          onClick={() =>
                            toggleCategoryPermissions(catKeys, isAllCategorySelected)
                          }
                        >
                          {isAllCategorySelected ? "Deselect Group" : "Select Group"}
                        </Button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {category.permissions.map((perm) => {
                          const isChecked = formData.permissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-2.5 rounded-md border p-2 text-xs transition-colors cursor-pointer ${
                                isChecked
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border/60 hover:bg-muted/40"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm.key)}
                                className="mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <span className="font-medium text-foreground block">
                                  {perm.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-snug block">
                                  {perm.description}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageContent>
  );
}
