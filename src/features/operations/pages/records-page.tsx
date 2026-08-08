import { Panel, PageHeader } from "@/components/ui-kit";

export function RecordsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Records" description="Operational records across modules." />
      <Panel>
        <p className="text-sm text-muted-foreground">No records yet.</p>
      </Panel>
    </div>
  );
}
