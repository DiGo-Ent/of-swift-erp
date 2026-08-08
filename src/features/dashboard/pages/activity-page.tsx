import { Panel, PageHeader } from "@/components/ui-kit";

export function ActivityPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Activity" description="Recent workspace events." />
      <Panel>
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </Panel>
    </div>
  );
}
