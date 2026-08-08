import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Factor = { id: string; friendly_name?: string | null; status: string };
export type Enrollment = { id: string; qr: string; secret: string };

export function useTotpFactors() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function startEnroll() {
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${Date.now()}`,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify() {
    if (!enroll) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enroll.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setEnroll(null);
    setCode("");
    setMsg("Two-factor authentication enabled.");
    void load();
  }

  async function unenroll(id: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setMsg(error ? error.message : "Factor removed.");
    void load();
  }

  return {
    factors,
    enroll,
    setEnroll,
    code,
    setCode,
    msg,
    busy,
    startEnroll,
    verify,
    unenroll,
  };
}
