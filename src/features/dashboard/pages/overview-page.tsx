import { Panel, PageHeader } from "@/components/ui-kit";
import { useDashboardStats } from "../hooks/use-dashboard-stats";

export function OverviewPage() {
  const stats = useDashboardStats();

  return (
    <div className="space-y-5">
      <PageHeader title="Overview" description="Your ERP workspace at a glance." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Panel key={s.label}>
            <p className="truncate text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-semibold sm:text-2xl">{s.value}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
