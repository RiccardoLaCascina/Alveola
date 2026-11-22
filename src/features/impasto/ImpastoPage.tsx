import { FlaskConical, Wheat } from "lucide-react";
import { Block } from "@/components/Block";
import { PageTitle } from "@/components/PageTitle";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { AddChips } from "@/components/AddChips";
import { EmptyHint } from "@/components/EmptyHint";
import { PREFERMENT_TYPES, type YeastType } from "@/domain/model";
import { PREFERMENT_SHORT_LABEL } from "@/domain/presets";
import { useDoughStore } from "@/state/doughStore";
import { PrefermentCard } from "./PrefermentCard";
import { ResetDough } from "./ResetDough";

const YEAST_OPTIONS: { value: YeastType; label: string }[] = [
  { value: "fresh", label: "Birra fresco" },
  { value: "dry", label: "Birra secco" },
  { value: "none", label: "Nessuno" },
];

const Dot = ({ className }: { className: string }) => <span className={`inline-block size-2.5 rounded-sm ${className}`} />;

export function ImpastoPage() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const addPreferment = useDoughStore((s) => s.addPreferment);

  return (
    <>
      <PageTitle title="Impasto" subtitle="La ricetta di oggi, in grammi." />

      <Block icon={Wheat} title="Impasto finale" hint="Quello che aggiungi nella vasca, esclusi i prefermenti.">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label={<><Dot className="bg-flour" /> Farina</>} unit="g" value={dough.flour} onChange={(v) => setField("flour", v)} />
          <NumberField label={<><Dot className="bg-water" /> Acqua</>} unit="g" value={dough.water} onChange={(v) => setField("water", v)} />
          <NumberField label={<><Dot className="bg-muted-foreground/60" /> Sale</>} unit="g" value={dough.salt} onChange={(v) => setField("salt", v)} />
          <NumberField label={<><Dot className="bg-muted-foreground/60" /> Olio / grassi</>} unit="g" value={dough.fat} onChange={(v) => setField("fat", v)} />
        </div>
        <h3 className="mt-5 mb-2 font-heading text-base font-bold">Lievito</h3>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Tipo" value={dough.yeastType} options={YEAST_OPTIONS} onChange={(v) => setField("yeastType", v)} />
          <NumberField
            label="Quantità"
            unit="g"
            value={dough.yeast}
            disabled={dough.yeastType === "none"}
            onChange={(v) => setField("yeast", v)}
          />
        </div>
      </Block>

      <Block icon={FlaskConical} title="Prefermenti" hint="Farina e acqua contenute nei prefermenti entrano nel calcolo dell’idratazione totale.">
        <div className="flex flex-col gap-3">
          {dough.preferments.length === 0 ? (
            <EmptyHint>Nessun prefermento: l’impasto è diretto. Aggiungine uno qui sotto.</EmptyHint>
          ) : (
            dough.preferments.map((p) => <PrefermentCard key={p.id} preferment={p} />)
          )}
        </div>
        <AddChips
          chips={PREFERMENT_TYPES.map((t) => ({ key: t, label: PREFERMENT_SHORT_LABEL[t], onAdd: () => addPreferment(t) }))}
        />
      </Block>

      <ResetDough />
    </>
  );
}
