import { Layers, Sun, Thermometer, Wheat } from "lucide-react";
import { Block } from "@/components/Block";
import { PageTitle } from "@/components/PageTitle";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { Segmented } from "@/components/form/Segmented";
import { AddChips } from "@/components/AddChips";
import { EmptyHint } from "@/components/EmptyHint";
import { MIXER_TYPES, type AdaptMode } from "@/domain/model";
import { MIXERS, PHASE_PRESETS } from "@/domain/presets";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { PhaseRow } from "./PhaseRow";
import { PlanBlock } from "./PlanBlock";
import { FlourStrength } from "./FlourStrength";

const MIXER_OPTIONS = MIXER_TYPES.map((m) => ({ value: m, label: MIXERS[m].label }));
const ADAPT_OPTIONS: { value: AdaptMode; label: string }[] = [
  { value: "yeast", label: "Adatta il lievito" },
  { value: "times", label: "Adatta i tempi" },
];

export function TempiPage() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const setPlan = useDoughStore((s) => s.setPlan);
  const addPhase = useDoughStore((s) => s.addPhase);
  const analysis = useDoughAnalysis();

  return (
    <>
      <PageTitle title="Tempi" subtitle="Ambiente, maturazione e programma della giornata." />

      <PlanBlock />

      <Block icon={Sun} title="Ambiente di oggi" hint="Il laboratorio cambia con le stagioni: le fasi a temperatura ambiente usano questi valori.">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Temperatura" unit="°C" allowNegative placeholder="es. 24" value={dough.ambientTemp} onChange={(v) => setField("ambientTemp", v)} />
          <NumberField label="Umidità" unit="%" placeholder="es. 60" value={dough.ambientHumidity} onChange={(v) => setField("ambientHumidity", v)} />
        </div>
        <p className="mt-4 mb-2 text-sm text-muted-foreground">Se oggi fa più caldo o più freddo del previsto:</p>
        <Segmented ariaLabel="Come compensare la temperatura di oggi" value={dough.plan.adapt} options={ADAPT_OPTIONS} onChange={(adapt) => setPlan({ adapt })} />
        <p className="mt-2 text-xs text-muted-foreground">
          {dough.plan.adapt === "yeast"
            ? "I tempi restano quelli scritti; cambia la dose di lievito consigliata."
            : "Il lievito resta quello che usi; puntata e appretto si allungano o si accorciano perché la maturazione valga lo stesso."}
        </p>
      </Block>

      <Block icon={Layers} title="Fasi" hint="Nell’ordine in cui avvengono. Segna quelle a temperatura ambiente e quelle già in panetti.">
        <div className="flex flex-col gap-3">
          {dough.phases.length === 0 ? (
            <EmptyHint>Nessuna fase: aggiungi almeno la puntata o l’appretto.</EmptyHint>
          ) : (
            dough.phases.map((p) => <PhaseRow key={p.id} phase={p} />)
          )}
        </div>
        <AddChips chips={PHASE_PRESETS.map((p) => ({ key: p.label, label: p.label, onAdd: () => addPhase(p) }))} />
      </Block>

      <Block icon={Thermometer} title="Temperature di impastamento" hint="Per calcolare a che temperatura usare l’acqua.">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Finale impasto" unit="°C" allowNegative value={dough.targetDoughTemp} onChange={(v) => setField("targetDoughTemp", v)} />
          <NumberField label="Farina" unit="°C" allowNegative value={dough.flourTemp} onChange={(v) => setField("flourTemp", v)} />
          {dough.preferments.length > 0 && (
            <NumberField label="Prefermenti" unit="°C" allowNegative value={dough.prefermentTemp} onChange={(v) => setField("prefermentTemp", v)} />
          )}
          <SelectField label="Impastatrice" value={dough.mixer} options={MIXER_OPTIONS} onChange={(v) => setField("mixer", v)} />
        </div>
      </Block>

      <Block icon={Wheat} title="Forza della farina" hint="Dalla miscela scelta in Impasto, oppure scritta a mano dalla scheda del sacco.">
        <div className="grid grid-cols-2 gap-3">
          <FlourStrength w={analysis.flours.effectiveW} manualW={dough.flourW} onManualChange={(v) => setField("flourW", v)} />
        </div>
      </Block>
    </>
  );
}
