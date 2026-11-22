import { CalendarClock, Layers, Thermometer } from "lucide-react";
import { Block } from "@/components/Block";
import { PageTitle } from "@/components/PageTitle";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { AddChips } from "@/components/AddChips";
import { EmptyHint } from "@/components/EmptyHint";
import { MIXER_TYPES } from "@/domain/model";
import { MIXERS, PHASE_PRESETS } from "@/domain/presets";
import { useDoughStore } from "@/state/doughStore";
import { PhaseRow } from "./PhaseRow";

const MIXER_OPTIONS = MIXER_TYPES.map((m) => ({ value: m, label: MIXERS[m].label }));

export function TempiPage() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const addPhase = useDoughStore((s) => s.addPhase);

  return (
    <>
      <PageTitle title="Tempi" subtitle="Maturazione, lievitazione e temperature." />

      <Block icon={Layers} title="Fasi" hint="Durata e temperatura di ogni riposo, nell’ordine in cui avvengono.">
        <div className="flex flex-col gap-3">
          {dough.phases.length === 0 ? (
            <EmptyHint>Nessuna fase: aggiungi almeno la puntata o l’appretto.</EmptyHint>
          ) : (
            dough.phases.map((p) => <PhaseRow key={p.id} phase={p} />)
          )}
        </div>
        <AddChips chips={PHASE_PRESETS.map((p) => ({ key: p.label, label: p.label, onAdd: () => addPhase(p.name, p.hours, p.temp) }))} />
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

      <Block icon={CalendarClock} title="Farina e programma" hint="La forza (W) è sulla scheda tecnica del sacco.">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Forza (W)" placeholder="es. 300" value={dough.flourW} onChange={(v) => setField("flourW", v)} />
          <TextField label="Inizio impasto" type="datetime-local" value={dough.start} onChange={(v) => setField("start", v)} className="col-span-2" />
        </div>
      </Block>
    </>
  );
}
