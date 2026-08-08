import { Btn, Field } from "@/components/ui-kit";
import type { Enrollment } from "../hooks/use-totp-factors";

type Props = {
  enrollment: Enrollment;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onCancel: () => void;
  busy: boolean;
};

export function EnrollTotp({
  enrollment,
  code,
  onCodeChange,
  onVerify,
  onCancel,
  busy,
}: Props) {
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <img
        src={enrollment.qr}
        alt="TOTP QR code"
        width={180}
        height={180}
        className="h-[180px] w-[180px] rounded-md bg-white p-1"
      />
      <p className="break-all text-xs text-muted-foreground">
        Secret: <code>{enrollment.secret}</code>
      </p>
      <div className="flex flex-wrap gap-2">
        <Field
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          className="w-32"
        />
        <Btn onClick={onVerify} disabled={busy}>
          Verify
        </Btn>
        <Btn variant="ghost" onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}
