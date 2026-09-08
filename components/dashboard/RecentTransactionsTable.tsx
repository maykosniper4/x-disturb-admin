import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "@/lib/file-saver";
import { useTransaction } from "@/hooks/useTransaction";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useFetchUsers } from "@/app/api/user-management-api";
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
import { AdminFilterPills } from "@/components/admin/admin-filter-panel";
import { adminHeaderButtonClassName } from "@/components/admin/admin-page-header";
import { getTransactionStatusTone } from "@/lib/admin-status-badge";
import {
  formatAdminDate,
  formatAdminAmount,
  getPlanLabel,
  getUserLabel,
} from "@/lib/admin-display";

const STATUS_OPTIONS = ["All", "success", "pending", "failed"] as const;
type FilterStatus = (typeof STATUS_OPTIONS)[number];

export default function TransactionTable() {
  const { transactions, loading } = useTransaction();
  const { plans } = useSubscriptionPlans();
  const { users } = useFetchUsers();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered =
    statusFilter === "All"
      ? transactions
      : transactions.filter(
          (tx) => tx.status.toLowerCase() === statusFilter.toLowerCase()
        );

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = filtered.map((tx) => ({
      Date: formatAdminDate(tx.created_at),
      User: getUserLabel(tx.user_id, users, tx.user_label),
      Plan: getPlanLabel(tx.plan_id, plans, tx.plan_label),
      Amount: formatAdminAmount(tx.amount, tx.currency),
      "TX Ref": tx.tx_ref,
      Status: tx.status,
      "Updated At": formatAdminDate(tx.updated_at),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileBlob, "transactions.xlsx");
  };

  const filterOptions = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: status,
    count:
      status === "All"
        ? transactions.length
        : transactions.filter(
            (tx) => tx.status.toLowerCase() === status.toLowerCase()
          ).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="admin-section-title">All Transactions</h2>
        <AdminFilterPills
          options={filterOptions}
          value={statusFilter}
          onChange={handleFilterChange}
        />
      </div>

      <AdminTableShell>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">TX Ref</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <AdminLoadingRow columns={6} />
              ) : paginatedData.length === 0 ? (
                <AdminDataTableEmpty
                  colSpan={6}
                  message={
                    statusFilter !== "All"
                      ? `No transactions with status "${statusFilter}"`
                      : "No transactions found"
                  }
                />
              ) : (
                paginatedData.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {formatAdminDate(tx.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getUserLabel(tx.user_id, users, tx.user_label)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPlanLabel(tx.plan_id, plans, tx.plan_label)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatAdminAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                      {tx.tx_ref}
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        label={tx.status}
                        tone={getTransactionStatusTone(tx.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AdminTableShell>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Button
          onClick={handleExport}
          variant="outline"
          className={adminHeaderButtonClassName("gap-2")}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        />
      </div>
    </div>
  );
}
