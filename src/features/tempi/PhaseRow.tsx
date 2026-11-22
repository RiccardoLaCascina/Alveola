import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/form/NumberField";
import { TextField } from "@/components/form/TextField";
import { BAND_BORDER } from "@/components/tempBand";
import type { Phase } from "@/domain/model";
import { tempBand } from "@/domain/lievito";
import { useDoughStore } from "@/state/doughStore";
import { cn } from "@/lib/utils";

/** Una fase di maturazione. Il bordo sinistro prende il colore della sua temperatura. */
export function PhaseRow({ phase: p }: { phase: Phase }) {
  const update = useDoughStore((s) => s.updatePhase);
  const remove = useDoughStore((s) => s.removePhase);

  return (
    <div className={cn("rounded-xl border border-l-4 bg-muted/40 p-3", BAND_BORDER[tempBand(p.temp ?? 20)])}>
      <div className="mb-3 flex items-end gap-2">
        <TextField label="Fase" value={p.name} onChange={(v) => update(p.id, { name: v })} className="flex-1" />
        <Button type="button" variant="ghost" size="icon" className="size-12 text-muted-foreground" aria-label={`Rimuovi fase ${p.name}`} onClick={() => remove(p.id)}>
          <Trash2 className="size-5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Durata" unit="h" value={p.hours} onChange={(v) => update(p.id, { hours: v })} />
        <NumberField label="Temperatura" unit="°C" allowNegative value={p.temp} onChange={(v) => update(p.id, { temp: v })} />
      </div>
    </div>
  );
}
