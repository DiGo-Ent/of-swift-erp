import { Btn } from "@/components/ui-kit";
import type { Factor } from "../hooks/use-totp-factors";

export function FactorList({
  factors,
  onRemove,
}: {
  factors: Factor[];
  onRemove: (id: string) => void;
}) {
  if (factors.length === 0) {
    return <p className="text-sm text-muted-foreground">No factors enrolled.</p>;
  }
  return (
    <>
      {factors.map((f) => (
        <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="min-w-0 truncate">
            {f.friendly_name || "Authenticator"}{" "}
            <span className="text-xs text-muted-foreground">({f.status})</span>
          </span>
          <Btn
            variant="outline"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={() => onRemove(f.id)}
          >
            Remove
          </Btn>
        </div>
      ))}
    </>
  );
}
