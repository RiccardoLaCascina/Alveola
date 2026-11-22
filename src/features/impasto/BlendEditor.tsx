import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { EmptyHint } from "@/components/EmptyHint";
import type { BlendPart, Flour } from "@/domain/model";
import { flourDisplayName } from "@/domain/presets";
import { BLEND_SUM_TOLERANCE, blendSum } from "@/domain/miscela";
import { fmt } from "@/domain/format";
import { useFlourArchive } from "@/state/flours";
import { FlourFormSheet } from "@/features/farine/FlourFormSheet";
import { cn } from "@/lib/utils";

type Props = {
  parts: BlendPart[];
  onChange: (parts: BlendPart[]) => void;
  /** testo mostrato quando la miscela è vuota */
  emptyText: string;
  /** di quale miscela si tratta, per i lettori di schermo (es. "dell'impasto", "della biga") */
  context: string;
};

/**
 * Editor di una miscela di farine: una riga per farina (scelta dall'archivio + quota in %),
 * la somma delle quote, e i pulsanti per aggiungere una farina esistente o crearne una nuova.
 */
export function BlendEditor({ parts, onChange, emptyText, context }: Props) {
  const { flours, loaded, failed } = useFlourArchive();
  const [creating, setCreating] = useState(false);
  const sum = blendSum(parts);
  const sumOk = Math.abs(sum - 100) <= BLEND_SUM_TOLERANCE;

  const addFlour = (flour: Flour | undefined) => {
    if (!flour) return;
    const remaining = Math.max(0, Math.round((100 - sum) * 10) / 10);
    onChange([...parts, { flourId: flour.id, percent: parts.length === 0 ? 100 : remaining || null }]);
  };
  const firstUnused = () => flours.find((f) => !parts.some((p) => p.flourId === f.id)) ?? flours[0];
  const update = (i: number, patch: Partial<BlendPart>) => onChange(parts.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(parts.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-3">
      {parts.length === 0 && <EmptyHint>{emptyText}</EmptyHint>}
      {failed && (
        <p className="rounded-xl bg-warm/15 px-3 py-2.5 text-sm">
          L’archivio farine non è disponibile su questo dispositivo (navigazione privata o memoria piena).
        </p>
      )}

      {parts.map((p, i) => {
        const flour = flours.find((f) => f.id === p.flourId);
        // mentre l'archivio si carica non diciamo "eliminata": semplicemente non lo sappiamo ancora
        const fallbackLabel = loaded ? "Farina eliminata" : "Caricamento…";
        const options = [
          ...flours.map((f) => ({ value: f.id, label: flourDisplayName(f) })),
          ...(flour ? [] : [{ value: p.flourId, label: fallbackLabel }]),
        ];
        const name = flour ? flourDisplayName(flour) : `farina ${i + 1}`;
        return (
          <div key={i} className="grid grid-cols-[1fr_6.5rem_auto] items-end gap-2">
            <SelectField ariaLabel={`Farina ${i + 1} della miscela ${context}`} value={p.flourId} options={options} onChange={(id) => update(i, { flourId: id })} />
            <NumberField
              label={
                <>
                  <span aria-hidden="true" className={cn(i > 0 && "sr-only")}>
                    Quota
                  </span>
                  <span className="sr-only">{`Quota di ${name} nella miscela ${context}`}</span>
                </>
              }
              unit="%"
              value={p.percent}
              onChange={(v) => update(i, { percent: v })}
            />
            <Button type="button" variant="ghost" size="icon" className="size-12 text-muted-foreground" aria-label={`Togli ${name} dalla miscela ${context}`} onClick={() => remove(i)}>
              <Trash2 className="size-5" />
            </Button>
          </div>
        );
      })}

      {parts.length > 0 && (
        <p className={cn("text-sm tabular-nums", sumOk ? "text-muted-foreground" : "font-medium text-warm")}>
          Totale miscela: {fmt(sum, sum % 1 ? 1 : 0)} %{!sumOk && " — dovrebbe essere 100 %"}
        </p>
      )}

      {loaded && !failed && (
        <div className="flex flex-wrap gap-2">
          {flours.length > 0 && (
            <Button type="button" variant="outline" className="h-11 rounded-full border-dashed px-4" onClick={() => addFlour(firstUnused())}>
              <Plus /> Aggiungi farina
            </Button>
          )}
          <Button type="button" variant="outline" className="h-11 rounded-full border-dashed px-4" onClick={() => setCreating(true)}>
            <Plus /> {flours.length ? "Nuova farina" : "Crea la prima farina"}
          </Button>
        </div>
      )}

      <FlourFormSheet open={creating} onOpenChange={setCreating} onSaved={(f) => addFlour(f)} />
    </div>
  );
}
