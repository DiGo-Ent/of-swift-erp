import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Field, Label, Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — ERP Solution by DiGo" },
      { name: "description", content: "Set a new password for your ERP Solution account." },
      { property: "og:title", content: "Reset password — ERP Solution by DiGo" },
      { property: "og:description", content: "Set a new password for your ERP Solution account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg(error.message);
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Panel className="w-full max-w-sm">
        <h1 className="text-base font-semibold">Set a new password</h1>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="pw">New password</Label>
            <Field
              id="pw"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Btn type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Update password"}
          </Btn>
        </form>
        {msg && <p className="mt-3 text-xs text-destructive">{msg}</p>}
      </Panel>
    </main>
  );
}