import { Panel, PageHeader } from "@/components/ui-kit";

export function ModulesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Modules" description="ERP modules available in this workspace." />
      <Panel>
        <p className="text-sm text-muted-foreground">
          ERP modules will appear here as they are enabled.
        </p>
      </Panel>
    </div>
  );
}
