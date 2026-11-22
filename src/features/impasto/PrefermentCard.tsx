import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BlendEditor } from "./BlendEditor";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { PREFERMENT_TYPES, type Preferment } from "@/domain/model";
import { PREFERMENT_PRESETS, isSourdough } from "@/domain/presets";
import { fmt } from "@/domain/format";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";

/** La voce scelta prende il colore principale, così si vede subito quale è attiva. */
const TOGGLE_ITEM =
  "h-11 flex-1 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

const TYPE_OPTIONS =PREFERMENT_TYPES.map((t) => ({ value: t, label: PREFERMENT_PRESETS[t].label }));

export function PrefermentCard({ preferment: p }: { preferment: Preferment }) {
  const update = useDoughStore((s) => s.updatePreferment);
  const changeType = useDoughStore((s) => s.changePrefermentType);
  const remove = useDoughStore((s) => s.removePreferment);
  const breakdown = useDoughAnalysis().composition.preferments.find((b) => b.id === p.id);
  const sourdough = isSourdough(p.type);
  const mainBlend = useDoughStore((s) => s.dough.flourBlend);
  // "Miscela propria" resta selezionata anche mentre è ancora vuota (finché il pizzaiolo sceglie le farine).
  const [ownEmpty, setOwnEmpty] = useState(false);
  const ownBlend = p.flourBlend.length > 0 || ownEmpty;

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
      <div className="mt-4">
        <p className="mb-2 text-sm text-muted-foreground">Farina del prefermento</p>
        <ToggleGroup
          type="single"
          variant="outline"
          value={ownBlend ? "own" : "same"}
          onValueChange={(v) => {
            // v === "" quando si ritocca la voce già scelta: non cambia niente.
            if (v === "same") {
              update(p.id, { flourBlend: [] });
              setOwnEmpty(false);
            } else if (v === "own" && !ownBlend) {
              // si parte da una copia della miscela dell'impasto, da modificare
              if (mainBlend.length) update(p.id, { flourBlend: mainBlend.map((x) => ({ ...x })) });
              setOwnEmpty(true);
            }
          }}
          className="mb-3 w-full"
        >
          <ToggleGroupItem value="same" className={TOGGLE_ITEM}>
            Come l’impasto
          </ToggleGroupItem>
          <ToggleGroupItem value="own" className={TOGGLE_ITEM}>
            Miscela propria
          </ToggleGroupItem>
        </ToggleGroup>
        {ownBlend && (
          <BlendEditor
            parts={p.flourBlend}
            onChange={(parts) => update(p.id, { flourBlend: parts })}
            context={`del prefermento ${PREFERMENT_PRESETS[p.type].label.toLowerCase()}`}
            emptyText="Scegli le farine di questo prefermento (es. biga 100 % manitoba)."
          />
        )}
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
