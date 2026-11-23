import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Riquadro con etichetta piccola, valore grande e nota. */
export function StatTile({ label, value, note, className }: { label: string; value: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-xl bg-muted/50 p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-xl leading-tight font-extrabold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
