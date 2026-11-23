import type { Flour } from "@/domain/model";
import { fmt } from "@/domain/format";

/** I dati tecnici di una farina come piccole etichette: W 300 · P/L 0,55 · 12,5 % prot. · ass. 60 %. */
export function FlourSpecs({ flour }: { flour: Flour }) {
  const specs = [
    flour.w != null && `W ${fmt(flour.w)}`,
    flour.pl != null && `P/L ${fmt(flour.pl, 2)}`,
    flour.protein != null && `${fmt(flour.protein, 1)} % prot.${flour.proteinBasis === "ss" ? " s.s." : ""}`,
    flour.absorption != null && `ass. ${fmt(flour.absorption, 0)} %`,
  ].filter(Boolean) as string[];

  if (!specs.length) return <span className="text-xs text-muted-foreground">Nessun dato tecnico</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {specs.map((s) => (
        <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          {s}
        </span>
      ))}
    </span>
  );
}
