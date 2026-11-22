import { NumberField } from "@/components/form/NumberField";
import type { EffectiveW } from "@/domain/miscela";
import { fmt } from "@/domain/format";

type Props = { w: EffectiveW; manualW: number | null; onManualChange: (v: number | null) => void };

/**
 * Forza (W) dell'impasto:
 * - tutta la farina ha la W in archivio → mostriamo quella della miscela, senza campo manuale;
 * - solo una parte → mostriamo la W parziale e chiediamo la W della farina che non ce l'ha;
 * - nessuna W dalla miscela → campo manuale come prima.
 */
export function FlourStrength({ w, manualW, onManualChange }: Props) {
  if (w.source === "loading") return <p className="col-span-2 text-sm text-muted-foreground">Caricamento delle farine…</p>;

  if (w.source === "blend" && w.value)
    return (
      <div className="col-span-2 rounded-xl bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">Forza (W) della miscela</p>
        <p className="font-heading text-2xl font-extrabold tabular-nums">W {fmt(w.value, 0)}</p>
        <p className="text-xs text-muted-foreground">Calcolata dalle farine scelte nella scheda Impasto.</p>
      </div>
    );

  const partial = w.source === "mixed" || w.source === "partial";
  const uncovered = fmt((1 - w.coverage) * 100, 0);
  return (
    <div className="col-span-2 grid grid-cols-2 gap-3">
      <NumberField
        label={partial ? `W della farina senza scheda (${uncovered} %)` : "Forza (W)"}
        placeholder="es. 300"
        value={manualW}
        onChange={onManualChange}
      />
      {partial && w.value && (
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{w.source === "mixed" ? "W complessiva" : "W parziale"}</p>
          <p className="font-heading text-xl font-extrabold tabular-nums">W {fmt(w.value, 0)}</p>
          <p className="text-xs text-muted-foreground">
            {w.source === "mixed" ? "miscela + valore scritto" : `vale per il ${fmt(w.coverage * 100, 0)} % della farina`}
          </p>
        </div>
      )}
    </div>
  );
}
