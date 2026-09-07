"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Edit, Download, CheckCircle, XCircle, Phone } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminTableShell,
  AdminDataTableEmpty,
  AdminLoadingRow,
  AdminPagination,
} from "@/components/admin/data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { formatAdminDate, formatAdminDateShort } from "@/lib/admin-display";
import { User } from "@/app/api/user-management-api";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface UserManagementTableProps {
  users: User[];
  handleToggle: (id: string, status: boolean, userName?: string) => void;
  handleDelete: (id: string, userName?: string) => void;
  handleBulkStatus?: (ids: string[], newStatus: boolean) => void;
  isLoading: boolean;
}

const PAGE_SIZE = 10;

function getRoleTone(role?: string) {
  if (!role) return "neutral";
  const r = role.toLowerCase();
  if (r.includes("super") || r.includes("admin")) return "brand";
  if (r.includes("manager") || r.includes("zone")) return "info";
  if (r.includes("support") || r.includes("moderator")) return "success";
  if (r.includes("audit")) return "warning";
  return "neutral";
}

function getCategoryTone(cat?: string) {
  if (!cat) return "neutral";
  const c = cat.toLowerCase();
  if (c.includes("orthodox")) return "warning";
  if (c.includes("muslim")) return "success";
  if (c.includes("protestant")) return "info";
  return "neutral";
}

const UserManagementTable = ({
  users,
  handleToggle,
  handleDelete,
  handleBulkStatus,
  isLoading,
}: UserManagementTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedUsers = users.slice(
    (pageIndex - 1) * PAGE_SIZE,
    pageIndex * PAGE_SIZE
  );

  const allPageIds = paginatedUsers.map((u) => u.id);
  const isAllPageSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      allPageIds.forEach((id) => next.delete(id));
    } else {
      allPageIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExport = (exportAll = true) => {
    const dataset = exportAll
      ? users
      : users.filter((u) => selectedIds.has(u.id));

    const exportRows = dataset.map((user) => ({
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
    saveAs(fileBlob, `x-disturb-users-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
              {selectedIds.size}
            </span>
            <span>selected across all pages</span>
          </div>

          <div className="flex items-center gap-2">
            {handleBulkStatus && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  onClick={() => {
                    handleBulkStatus(Array.from(selectedIds), true);
                    setSelectedIds(new Set());
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  onClick={() => {
                    handleBulkStatus(Array.from(selectedIds), false);
                    setSelectedIds(new Set());
                  }}
                >
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  Suspend
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => handleExport(false)}
            >
              <Download className="h-3.5 w-3.5" />
              Export Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <AdminTableShell>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllPageSelected}
                    onCheckedChange={toggleSelectAllPage}
                    aria-label="Select all on this page"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Phone Number</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Referral Code</TableHead>
                <TableHead className="text-muted-foreground">Registered</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="w-20 text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminLoadingRow columns={9} rows={PAGE_SIZE} />
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const isSelected = selectedIds.has(user.id);
                  const userName = user.name || user.displayName || "Unnamed User";
                  const createdDate = user.createdAt
                    ? typeof (user.createdAt as any).toDate === "function"
                      ? (user.createdAt as any).toDate()
                      : new Date((user.createdAt as any).seconds * 1000)
                    : null;

                  return (
                    <TableRow
                      key={user.id}
                      className={`group transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(user.id)}
                          aria-label={`Select ${userName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {userName}
                          </p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-foreground">
                        {user.phoneNumber ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {user.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge
                          label={user.category || "General"}
                          tone={getCategoryTone(user.category)}
                        />
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge
                          label={user.role || "User"}
                          tone={getRoleTone(user.role)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {user.referralCode || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {createdDate ? formatAdminDateShort(createdDate) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() =>
                              handleToggle(user.id, user.isActive, userName)
                            }
                            aria-label={`Toggle status for ${userName}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/dashboard/users-management/${user.id}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label="Edit user"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top">Edit details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id, userName)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Delete user</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <AdminDataTableEmpty colSpan={9} message="No users match your filters" />
              )}
            </TableBody>
          </Table>
        </div>
      </AdminTableShell>

      {!isLoading && users.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(pageIndex - 1) * PAGE_SIZE + 1}–
            {Math.min(pageIndex * PAGE_SIZE, users.length)} of {users.length} users
          </p>
          <AdminPagination
            currentPage={pageIndex}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
