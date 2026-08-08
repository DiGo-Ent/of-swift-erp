import { Btn, Panel, PageHeader } from "@/components/ui-kit";
import { useTotpFactors } from "../hooks/use-totp-factors";
import { FactorList } from "../components/factor-list";
import { EnrollTotp } from "../components/enroll-totp";

export function TwoFactorPage() {
  const {
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
  } = useTotpFactors();

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader
        title="Two-factor authentication"
        description="TOTP via Supabase native MFA. Use any authenticator app."
      />
      <Panel className="space-y-3">
        <FactorList factors={factors} onRemove={unenroll} />
        {!enroll ? (
          <Btn onClick={startEnroll} disabled={busy}>
            Enroll authenticator
          </Btn>
        ) : (
          <EnrollTotp
            enrollment={enroll}
            code={code}
            onCodeChange={setCode}
            onVerify={verify}
            onCancel={() => setEnroll(null)}
            busy={busy}
          />
        )}
        {msg && <p className="text-xs text-primary">{msg}</p>}
      </Panel>
    </div>
  );
}
