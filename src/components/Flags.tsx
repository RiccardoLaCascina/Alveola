import { CircleCheck, TriangleAlert } from "lucide-react";
import type { Flag } from "@/domain/model";
import { cn } from "@/lib/utils";

/** Elenco di avvisi (ambra) e conferme (verde-acqua) calcolati dal dominio. */
export function Flags({ flags, className }: { flags: Flag[]; className?: string }) {
  if (!flags.length) return null;
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {flags.map((f) => {
        const warning = f.tone === "warning";
        const Icon = warning ? TriangleAlert : CircleCheck;
        return (
          <li
            key={f.message}
            className={cn(
              "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm",
              warning ? "bg-warm/15 text-foreground" : "bg-water/12 text-foreground",
            )}
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", warning ? "text-warm" : "text-water")} />
            <span>{f.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
