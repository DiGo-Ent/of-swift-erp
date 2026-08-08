import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUpdatePassword() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setPassword("");
    setMsg(error ? error.message : "Password updated.");
  }

  return { password, setPassword, msg, busy, updatePassword };
}
