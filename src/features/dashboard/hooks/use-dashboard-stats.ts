export type DashboardStat = { label: string; value: string };

const STATS: DashboardStat[] = [
  { label: "Open orders", value: "0" },
  { label: "Inventory items", value: "0" },
  { label: "Invoices due", value: "0" },
  { label: "Active users", value: "1" },
];

/** Dashboard KPI tiles. Swap for a server-backed query when data exists. */
export function useDashboardStats(): DashboardStat[] {
  return STATS;
}
