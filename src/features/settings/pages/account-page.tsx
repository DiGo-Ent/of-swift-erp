import { Btn, Field, Label, Panel, PageHeader } from "@/components/ui-kit";
import { useAuthUser } from "@/features/shell/hooks/use-auth-user";
import { useUpdatePassword } from "../hooks/use-update-password";

export function AccountPage() {
  const user = useAuthUser();
  const { password, setPassword, msg, busy, updatePassword } = useUpdatePassword();

  return (
    <div className="max-w-md space-y-4">
      <PageHeader title="Account" description="Manage your credentials." />
      <Panel className="space-y-3">
        <p className="break-words text-sm">
          <span className="text-muted-foreground">Signed in as</span> {user.email}
        </p>
        <form onSubmit={updatePassword} className="space-y-3 border-t border-border pt-3">
          <div>
            <Label htmlFor="np">New password</Label>
            <Field
              id="np"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Btn type="submit" disabled={busy} className="w-full sm:w-auto">
            Update password
          </Btn>
        </form>
        {msg && <p className="text-xs text-primary">{msg}</p>}
      </Panel>
    </div>
  );
}
