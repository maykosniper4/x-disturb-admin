import type { DashboardMetrics } from "@/lib/dashboard-metrics";

export const dashboardDemoMetrics: DashboardMetrics = {
  stats: {
    totalActivities: 12456,
    activityChangePercent: 10,
    totalUsers: 3210,
    activeUsers: 3048,
    userChangePercent: -5,
    activeZones: 18,
    peakZoneEntries: 4200,
    averageDwellMinutes: 25,
    dwellChangePercent: 15,
    entryRatePercent: 75,
    entryRateChangePercent: 8,
    totalRevenue: 50000,
    currency: "ETB",
    completedTransactions: 342,
  },
  entriesOverTime: [
    { day: "Mon", entries: 1580 },
    { day: "Tue", entries: 1720 },
    { day: "Wed", entries: 1890 },
    { day: "Thu", entries: 1810 },
    { day: "Fri", entries: 2050 },
    { day: "Sat", entries: 2180 },
    { day: "Sun", entries: 2226 },
  ],
  entriesByZone: [
    { zone: "Addis Ababa", entries: 4200 },
    { zone: "Adama", entries: 3100 },
    { zone: "Bishoftu", entries: 2400 },
    { zone: "Bahir Dar", entries: 1850 },
    { zone: "Abrhot Library", entries: 906 },
  ],
  revenueByPlan: [
    { name: "X-Disturb", value: 25000 },
    { name: "Orthodox Tewahedo", value: 6250 },
    { name: "Protestant", value: 6250 },
    { name: "Mosque", value: 6250 },
    { name: "Library", value: 6250 },
  ],
  revenueTrend: [
    { period: "Mon", revenue: 2240 },
    { period: "Tue", revenue: 2430 },
    { period: "Wed", revenue: 2650 },
    { period: "Thu", revenue: 2460 },
    { period: "Fri", revenue: 2860 },
    { period: "Sat", revenue: 2980 },
    { period: "Sun", revenue: 3010 },
  ],
};

export function isDashboardDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DASHBOARD_DEMO === "true";
}
