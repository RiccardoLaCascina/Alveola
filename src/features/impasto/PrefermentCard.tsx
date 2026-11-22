import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { PREFERMENT_TYPES, type Preferment } from "@/domain/model";
import { PREFERMENT_PRESETS, isSourdough } from "@/domain/presets";
import { fmt } from "@/domain/format";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";

const TYPE_OPTIONS = PREFERMENT_TYPES.map((t) => ({ value: t, label: PREFERMENT_PRESETS[t].label }));

export function PrefermentCard({ preferment: p }: { preferment: Preferment }) {
  const update = useDoughStore((s) => s.updatePreferment);
  const changeType = useDoughStore((s) => s.changePrefermentType);
  const remove = useDoughStore((s) => s.removePreferment);
  const breakdown = useDoughAnalysis().composition.preferments.find((b) => b.id === p.id);
  const sourdough = isSourdough(p.type);

  return (
    <div className="rounded-xl border border-l-4 border-l-preferment bg-muted/40 p-3">
      <div className="mb-3 flex items-end gap-2">
        <SelectField
          ariaLabel="Tipo di prefermento"
          value={p.type}
          options={TYPE_OPTIONS}
          onChange={(t) => changeType(p.id, t)}
          className="flex-1"
        />
        <Button type="button" variant="ghost" size="icon" className="size-12 text-muted-foreground" aria-label="Rimuovi prefermento" onClick={() => remove(p.id)}>
          <Trash2 className="size-5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Peso totale" unit="g" value={p.weight} onChange={(v) => update(p.id, { weight: v })} />
        <NumberField label="Idratazione" unit="%" value={p.hydration} onChange={(v) => update(p.id, { hydration: v })} />
        {!sourdough && <NumberField label="Lievito fresco" unit="g" value={p.yeast} onChange={(v) => update(p.id, { yeast: v })} />}
      </div>
      {breakdown && (
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          Contiene {fmt(breakdown.flour)} g di farina e {fmt(breakdown.water)} g di acqua
          {breakdown.yeast > 0 && `, lievito ${fmt(breakdown.yeastPercent, 2)} % sulla sua farina`}
        </p>
      )}
    </div>
  );
}
