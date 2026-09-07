"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  updateUserStatus,
  useFetchUsers,
  deleteUser,
  createUser,
  type CreateUserInput,
} from "@/app/api/user-management-api";
import { fetchRoles, DEFAULT_ROLES, type Role } from "@/app/api/roles-api";
import UserManagementTable from "@/components/dashboard/user-management-table";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { AdminPageHeaderActions } from "@/components/admin/admin-page-header-provider";
import {
  AdminFilterPanel,
  AdminSearchInput,
  AdminFilterSelect,
} from "@/components/admin/admin-filter-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Download, Loader2, Phone } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { formatAdminDate, formatAdminDateShort } from "@/lib/admin-display";

const CATEGORY_OPTIONS = [
  { value: "Orthodox", label: "Orthodox" },
  { value: "Muslim", label: "Muslim" },
  { value: "Protestant", label: "Protestant" },
  { value: "General", label: "General" },
];

const emptyCreateForm = (): CreateUserInput => ({
  name: "",
  phoneNumber: "+2519",
  category: "Orthodox",
  email: "",
  role: "Standard Operator",
  referralCode: "",
  isActive: true,
});

const UsersManagementPage = () => {
  const { users, loading, refetch } = useFetchUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>(emptyCreateForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles().then((r) => {
      if (r && r.length > 0) setRoles(r);
    });
  }, []);

  const handleToggleStatus = async (
    userId: string,
    currentStatus: boolean,
    userName?: string
  ) => {
    const result = await updateUserStatus(userId, currentStatus, userName);
    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully.`
      );
      if (refetch) refetch();
    }
  };

  const handleDelete = async (userId: string, userName?: string) => {
    if (confirm(`Are you sure you want to delete user '${userName || userId}'?`)) {
      const result = await deleteUser(userId, userName);
      if (!result.success) {
        toast.error(result.message || "Failed to delete user");
      } else {
        toast.success("User deleted successfully.");
        if (refetch) refetch();
      }
    }
  };

  const handleBulkStatus = async (ids: string[], newStatus: boolean) => {
    let successCount = 0;
    for (const id of ids) {
      const u = users.find((item) => item.id === id);
      if (u && u.isActive !== newStatus) {
        const res = await updateUserStatus(id, u.isActive, u.name);
        if (res.success) successCount++;
      }
    }
    toast.success(`Updated status for ${successCount} users.`);
    if (refetch) refetch();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    const cleanPhone = createForm.phoneNumber.trim().replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone === "+2519" || cleanPhone === "+251") {
      toast.error("Valid Ethiopian phone number is required (e.g. +251911234567 or 0911234567).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser(createForm);
      if (res.success) {
        toast.success("User created successfully!");
        setCreateDialogOpen(false);
        setCreateForm(emptyCreateForm());
        if (refetch) refetch();
      } else {
        toast.error(res.message || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportAll = () => {
    const exportRows = filteredUsers.map((user) => ({
      Name: user.name || user.displayName || "N/A",
      "Phone Number": user.phoneNumber || "N/A",
      Category: user.category || "N/A",
      Email: user.email || "N/A",
      Role: user.role || "User",
      "Referral Code": user.referralCode || "N/A",
      Status: user.isActive ? "Active" : "Inactive",
      "Registered On": user.createdAt
        ? formatAdminDateShort(
            typeof (user.createdAt as any)?.toDate === "function"
              ? (user.createdAt as any).toDate()
              : new Date((user.createdAt as any).seconds * 1000)
          )
        : "N/A",
      "Last Login": user.lastLogin
        ? formatAdminDate(
            typeof (user.lastLogin as any)?.toDate === "function"
              ? (user.lastLogin as any).toDate()
              : new Date((user.lastLogin as any).seconds * 1000)
          )
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileBlob, `x-disturb-users-directory-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const roleFilterOptions = roles.map((r) => ({
    value: r.name,
    label: r.name,
  }));

  const categoryFilterOptions = CATEGORY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      user.name?.toLowerCase().includes(q) ||
      user.displayName?.toLowerCase().includes(q) ||
      user.phoneNumber?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.referralCode?.toLowerCase().includes(q);

    const matchesRole = roleFilter
      ? user.role?.toLowerCase() === roleFilter.toLowerCase()
      : true;

    const matchesCategory = categoryFilter
      ? user.category?.toLowerCase() === categoryFilter.toLowerCase()
      : true;

    return matchesSearch && matchesRole && matchesCategory;
  });

  return (
    <AdminPageContent>
      <AdminPageHeaderActions>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleExportAll}
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setCreateDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create User</span>
          </Button>
        </div>
      </AdminPageHeaderActions>

      <AdminFilterPanel>
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, phone (+251…), or email…"
          className="md:flex-1"
        />
        <AdminFilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryFilterOptions}
          placeholder="All Categories"
          className="md:w-44"
        />
        <AdminFilterSelect
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleFilterOptions}
          placeholder="All Roles"
          className="md:w-44"
        />
      </AdminFilterPanel>

      <UserManagementTable
        users={filteredUsers}
        handleToggle={handleToggleStatus}
        isLoading={loading}
        handleDelete={handleDelete}
        handleBulkStatus={handleBulkStatus}
      />

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new mobile user, operator, or community member account to X-Disturb.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g. Dawit Bekele"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-phone" className="flex items-center justify-between">
                <span>Phone Number *</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Mobile App Identity
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="create-phone"
                  type="tel"
                  placeholder="e.g. +251911234567 or 0911234567"
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                  required
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Matches the mobile app OTP login (+251 9... / +251 7...).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-category">Category *</Label>
                <Select
                  value={createForm.category}
                  onValueChange={(val) =>
                    setCreateForm((prev) => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger id="create-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-role">Assigned Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val) =>
                    setCreateForm((prev) => ({ ...prev, role: val }))
                  }
                >
                  <SelectTrigger id="create-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">
                Email Address <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="e.g. dawit@example.com (optional)"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-referral">
                Referral / Invite Code <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="create-referral"
                placeholder="e.g. 1RAS5UST (optional)"
                value={createForm.referralCode}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, referralCode: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="create-active" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow immediate sign-in and app privileges
                </p>
              </div>
              <Switch
                id="create-active"
                checked={createForm.isActive}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageContent>
  );
};

export default UsersManagementPage;
