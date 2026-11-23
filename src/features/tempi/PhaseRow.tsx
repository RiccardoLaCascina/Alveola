import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { NumberField } from "@/components/form/NumberField";
import { TextField } from "@/components/form/TextField";
import { BAND_BORDER } from "@/components/tempBand";
import type { Phase } from "@/domain/model";
import { tempBand } from "@/domain/lievito";
import { fmt } from "@/domain/format";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { cn } from "@/lib/utils";

const CHIP = "h-10 rounded-full border px-3 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

/**
 * Una fase di maturazione. Il bordo sinistro prende il colore della temperatura effettiva.
 * "Ambiente": la fase si fa a temperatura del laboratorio (oggi può essere diversa da quella prevista).
 * "In panetti": l'impasto è già in palline; lo staglio avviene prima della prima fase in panetti.
 */
export function PhaseRow({ phase: p }: { phase: Phase }) {
  const update = useDoughStore((s) => s.updatePhase);
  const remove = useDoughStore((s) => s.removePhase);
  const effective = useDoughAnalysis().maturation.phases.find((x) => x.id === p.id);
  const temp = effective?.temp ?? p.temp ?? 20;

  return (
    <div className={cn("rounded-xl border border-l-4 bg-muted/40 p-3", BAND_BORDER[tempBand(temp)])}>
      <div className="mb-3 flex items-end gap-2">
        <TextField label="Fase" value={p.name} onChange={(v) => update(p.id, { name: v })} className="flex-1" />
        <Button type="button" variant="ghost" size="icon" className="size-12 text-muted-foreground" aria-label={`Rimuovi fase ${p.name.trim() || "senza nome"}`} onClick={() => remove(p.id)}>
          <Trash2 className="size-5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Durata" unit="h" value={p.hours} onChange={(v) => update(p.id, { hours: v })} />
        <NumberField
          label={p.ambient ? "Temp. prevista" : "Temperatura"}
          unit="°C"
          allowNegative
          value={p.temp}
          onChange={(v) => update(p.id, { temp: v })}
        />
      </div>
      <div role="group" aria-label={`Opzioni della fase ${p.name.trim() || "senza nome"}`} className="mt-3 flex flex-wrap gap-2">
        <Toggle variant="outline" className={CHIP} pressed={p.ambient} onPressedChange={(v) => update(p.id, { ambient: v })}>
          A temperatura ambiente
        </Toggle>
        <Toggle variant="outline" className={CHIP} pressed={p.balled} onPressedChange={(v) => update(p.id, { balled: v })}>
          In panetti
        </Toggle>
      </div>
      {effective?.adapted && (
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          Oggi a {fmt(effective.temp, 0)} °C
          {Math.abs(effective.hours - effective.plannedHours) > 0.01 && (
            <>
              {" "}
              → <span className="font-medium text-foreground">{fmt(effective.hours, 1)} h</span> invece di {fmt(effective.plannedHours, 1)} h
            </>
          )}
        </p>
      )}
    </div>
  );
}
