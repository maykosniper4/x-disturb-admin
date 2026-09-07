"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  subscribeToAuditLogs,
  AUDIT_CATEGORY_LABELS,
  type AuditLog,
  type AuditCategory,
  type AuditStatusTone,
} from "@/app/api/audit-logs-api";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { AdminPageHeaderActions } from "@/components/admin/admin-page-header-provider";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import {
  AdminTableShell,
  AdminDataTableEmpty,
  AdminLoadingRow,
  AdminPagination,
} from "@/components/admin/data-table";
import {
  AdminFilterPanel,
  AdminSearchInput,
  AdminFilterPills,
} from "@/components/admin/admin-filter-panel";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { formatAdminDate, formatAdminCount } from "@/lib/admin-display";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Download,
  ShieldAlert,
  Users,
  Activity,
  Eye,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PAGE_SIZE = 10;

type DateRangeFilter = "all" | "today" | "week" | "month";

const CATEGORY_FILTER_KEYS: (AuditCategory | "all")[] = [
  "all",
  "users",
  "zones",
  "roles",
  "notifications",
  "billing",
  "system",
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuditLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  // Unique Actors
  const actors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    logs.forEach((log) => {
      if (!map.has(log.actorEmail)) {
        map.set(log.actorEmail, {
          id: log.actorId,
          name: log.actorName,
          email: log.actorEmail,
        });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Date boundary helpers
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesText =
          log.actionLabel.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.actorEmail.toLowerCase().includes(q) ||
          (log.targetName && log.targetName.toLowerCase().includes(q)) ||
          log.details.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      if (selectedCategory !== "all" && log.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== "all" && log.status !== selectedStatus) {
        return false;
      }

      if (selectedActor !== "all" && log.actorEmail !== selectedActor) {
        return false;
      }

      const logTime = log.timestamp.getTime();
      if (dateRange === "today" && logTime < startOfToday) return false;
      if (dateRange === "week" && logTime < sevenDaysAgo) return false;
      if (dateRange === "month" && logTime < thirtyDaysAgo) return false;

      return true;
    });
  }, [logs, search, selectedCategory, selectedStatus, dateRange, selectedActor]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  // Stats
  const todayCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return logs.filter((l) => l.timestamp >= startOfToday).length;
  }, [logs]);

  const highImpactCount = useMemo(() => {
    return logs.filter((l) => l.status === "danger" || l.status === "warning").length;
  }, [logs]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    dateRange !== "all" ||
    selectedActor !== "all";

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setDateRange("all");
    setSelectedActor("all");
    setPage(1);
  };

  const handleExport = () => {
    const exportRows = filteredLogs.map((log) => ({
      Timestamp: formatAdminDate(log.timestamp),
      "Action Event": log.actionLabel,
      Category: AUDIT_CATEGORY_LABELS[log.category] || log.category,
      "Performed By": `${log.actorName} (${log.actorEmail})`,
      Target: log.targetName ? `${log.targetName} [${log.targetType}]` : log.targetType,
      Severity: log.status.toUpperCase(),
      Details: log.details,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit_Trail");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileBlob, `x-disturb-audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const categoryPillOptions = CATEGORY_FILTER_KEYS.map((key) => ({
    value: key,
    label: key === "all" ? "All Categories" : AUDIT_CATEGORY_LABELS[key],
    count:
      key === "all"
        ? logs.length
        : logs.filter((l) => l.category === key).length,
  }));

  const getSeverityTone = (status: AuditStatusTone) => {
    if (status === "success") return "success";
    if (status === "warning") return "warning";
    if (status === "danger") return "danger";
    return "info";
  };

  return (
    <AdminPageContent wide className="space-y-6">
      <AdminPageHeaderActions>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Log</span>
        </Button>
      </AdminPageHeaderActions>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Recorded Events"
          value={formatAdminCount(logs.length)}
          icon={History}
          loading={loading}
        />
        <AdminStatCard
          title="Events Recorded Today"
          value={formatAdminCount(todayCount)}
          icon={Clock}
          loading={loading}
        />
        <AdminStatCard
          title="High-Impact / Security Alerts"
          value={formatAdminCount(highImpactCount)}
          icon={ShieldAlert}
          changeType={highImpactCount > 0 ? "warning" : "positive"}
          loading={loading}
        />
        <AdminStatCard
          title="Active Administrators"
          value={actors.length.toString()}
          icon={Users}
          loading={loading}
        />
      </div>

      {/* Main Table Card */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="admin-section-title">System Audit Trail</h2>
            <p className="admin-section-desc">
              Tamper-evident logs of administrative actions, permission adjustments, zone changes, and broadcast events.
            </p>
          </div>
          {!loading && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Showing {filteredLogs.length} of {logs.length} logged events
            </span>
          )}
        </div>

        {/* Filter Controls */}
        <div className="space-y-3">
          <AdminFilterPanel className="flex-wrap">
            <AdminSearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search action, operator, target, or details…"
              className="flex-1 min-w-[260px]"
            />

            <Select
              value={dateRange}
              onValueChange={(val: DateRangeFilter) => {
                setDateRange(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-44 bg-background">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today Only</SelectItem>
                <SelectItem value="week">Past 7 Days</SelectItem>
                <SelectItem value="month">Past 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 bg-background">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="danger">High Impact</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedActor}
              onValueChange={(val) => {
                setSelectedActor(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-48 bg-background">
                <SelectValue placeholder="All Operators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a.email} value={a.email}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </AdminFilterPanel>

          <AdminFilterPills
            options={categoryPillOptions}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
            }}
          />
        </div>

        {/* Table Shell */}
        <AdminTableShell>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-44 text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Operator</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Target Entity</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="max-w-xs text-muted-foreground">Details</TableHead>
                  <TableHead className="w-16 text-right text-muted-foreground">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <AdminLoadingRow columns={7} rows={PAGE_SIZE} />
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatAdminDate(log.timestamp)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-xs">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {log.actorName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground leading-none">
                              {log.actorName}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-none">
                              {log.actorEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-medium text-foreground">
                          {log.actionLabel}
                        </span>
                      </TableCell>

                      <TableCell>
                        {log.targetName ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground leading-none">
                              {log.targetName}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-none">
                              {log.targetType}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {log.targetType}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <AdminStatusBadge
                          label={log.status.toUpperCase()}
                          tone={getSeverityTone(log.status)}
                        />
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <p className="text-xs text-muted-foreground truncate" title={log.details}>
                          {log.details}
                        </p>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedLog(log)}
                          aria-label="Inspect log entry"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <AdminDataTableEmpty
                    colSpan={7}
                    message={
                      hasActiveFilters
                        ? "No audit events match your search criteria or filters"
                        : "No audit records logged yet"
                    }
                  />
                )}
              </TableBody>
            </Table>
          </div>
        </AdminTableShell>

        {!loading && filteredLogs.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} events
            </p>
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Audit Event Details</DialogTitle>
              {selectedLog && (
                <AdminStatusBadge
                  label={selectedLog.status.toUpperCase()}
                  tone={getSeverityTone(selectedLog.status)}
                />
              )}
            </div>
            <DialogDescription>
              Complete event telemetry and parameters recorded by X-Disturb.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <span className="text-muted-foreground block">Action</span>
                  <span className="font-semibold text-foreground">
                    {selectedLog.actionLabel}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Category</span>
                  <span className="font-semibold text-foreground capitalize">
                    {AUDIT_CATEGORY_LABELS[selectedLog.category] || selectedLog.category}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Timestamp</span>
                  <span className="font-medium text-foreground">
                    {formatAdminDate(selectedLog.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Event ID</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate block">
                    {selectedLog.id}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <span className="text-muted-foreground font-semibold block uppercase tracking-wider text-[10px]">
                  Actor & Target
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Operator</span>
                    <span className="font-medium text-foreground block">
                      {selectedLog.actorName}
                    </span>
                    <span className="text-muted-foreground text-[11px] block">
                      {selectedLog.actorEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Target</span>
                    <span className="font-medium text-foreground block">
                      {selectedLog.targetName || "—"}
                    </span>
                    <span className="text-muted-foreground text-[11px] block">
                      Type: {selectedLog.targetType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Explanation
                </span>
                <p className="rounded-md border border-border bg-background p-3 text-foreground leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    Event Metadata Payload
                  </span>
                  <pre className="max-h-40 overflow-y-auto rounded-md border border-border bg-slate-950 p-3 font-mono text-[11px] text-slate-100 dark:bg-muted/40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageContent>
  );
}
