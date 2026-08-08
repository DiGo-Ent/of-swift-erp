import { Panel, PageHeader } from "@/components/ui-kit";
import { useAuthUser } from "@/features/shell/hooks/use-auth-user";

export function SessionPage() {
  const user = useAuthUser();
  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Session" description="Details of your current signed-in session." />
      <Panel className="space-y-2 text-sm">
        <p className="break-words">
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
        <p className="break-all">
          <span className="text-muted-foreground">User ID:</span> {user.id}
        </p>
        <p className="break-words">
          <span className="text-muted-foreground">Last sign-in:</span>{" "}
          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}
        </p>
      </Panel>
    </div>
  );
}
