"use client";

import {
  useGetUserGrowthMetricsQuery,
  useGetRevenueMetricsQuery,
} from "@/store/metrics/metricsApi";
import ZoneActivityChart from "@/components/dashboard/report/zone-activity-chart";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { formatAdminCount } from "@/lib/admin-display";
import { Users, MapPin, DollarSign } from "lucide-react";
import {
  Area,
  XAxis,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  YAxis,
} from "recharts";

const CHART_PRIMARY = "hsl(var(--primary))";

export default function Reports() {
  const { data: userGrowthData, isLoading: loadingUsers } =
    useGetUserGrowthMetricsQuery();
  const { data: revenueMetricsData, isLoading: loadingRevenue } =
    useGetRevenueMetricsQuery();

  const timeData =
    userGrowthData?.monthlyGrowth
      ? Object.entries(userGrowthData.monthlyGrowth).map(([month, users]) => ({
          month,
          users,
        }))
      : [];

  const revenueData =
    revenueMetricsData?.revenueTrend.labels.map((label, index) => {
      let totalRevenue = 0;
      revenueMetricsData.revenueTrend.datasets.forEach((dataset) => {
        totalRevenue += dataset.data[index] ?? 0;
      });
      return {
        month: label,
        revenue: parseFloat(totalRevenue.toFixed(2)),
      };
    }) ?? [];

  const { metrics, loading: loadingMetrics } = useDashboardMetrics();
  const totalActivities = metrics?.stats?.totalActivities;
  const activityChange = metrics?.stats?.activityChangePercent ?? 0;

  return (
    <AdminPageContent>
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          title="Total users"
          value={userGrowthData?.totalUsers?.toLocaleString() ?? "—"}
          change={`${userGrowthData?.growthRate ?? "0"}% growth`}
          changeType="positive"
          icon={Users}
          loading={loadingUsers}
        />
        <AdminStatCard
          title="Zone activity"
          value={totalActivities !== undefined ? formatAdminCount(totalActivities) : "—"}
          change={
            metrics?.stats
              ? `${activityChange >= 0 ? "+" : ""}${activityChange}% vs last week`
              : undefined
          }
          changeType={
            activityChange > 0
              ? "positive"
              : activityChange < 0
                ? "negative"
                : "neutral"
          }
          icon={MapPin}
          loading={loadingMetrics}
        />
        <AdminStatCard
          title="Total revenue"
          value={`$${revenueMetricsData?.totalRevenueByCategory?.overallTotalRevenue.toFixed(2) ?? "—"}`}
          change="+15% vs last month"
          changeType="positive"
          icon={DollarSign}
          loading={loadingRevenue}
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">User growth</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <Skeleton className="h-[300px] w-full" />
          ) : timeData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No user growth data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={CHART_PRIMARY}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <ZoneActivityChart />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Payment revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRevenue ? (
            <Skeleton className="h-[300px] w-full" />
          ) : revenueData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No revenue data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_PRIMARY}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => exportCSV(timeData, "user-growth-report.csv")}
        >
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print report
        </Button>
      </div>
    </AdminPageContent>
  );
}

type CSVRow = Record<string, string | number>;

function exportCSV(data: CSVRow[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(",")).join("\n");
  const csv = `${headers}\n${rows}`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
