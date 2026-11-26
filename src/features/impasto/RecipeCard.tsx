import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { Segmented } from "@/components/form/Segmented";
import { EmptyHint } from "@/components/EmptyHint";
import type { RecipeMode, YeastType } from "@/domain/model";
import { fmt, fmtGrams, percent } from "@/domain/format";
import { gramsFromRecipe, suggestedHydration } from "@/domain/ricetta";
import { normalizeBlend } from "@/domain/miscela";
import { flourDisplayName } from "@/domain/presets";
import { yeastToApply } from "@/domain/analisi";
import { grams } from "@/domain/impasto";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { useFlourArchive } from "@/state/flours";

const MODE_OPTIONS: { value: RecipeMode; label: string }[] = [
  { value: "percent", label: "Calcola tu" },
  { value: "grams", label: "Scrivo i grammi" },
];

const YEAST_OPTIONS: { value: YeastType; label: string }[] = [
  { value: "fresh", label: "Birra fresco" },
  { value: "dry", label: "Birra secco" },
  { value: "none", label: "Nessuno" },
];

/**
 * Il cuore della pagina Impasto: quanto impasto fare.
 * - "Calcola tu": panetti + percentuali → l'app mostra i grammi da pesare.
 * - "Scrivo i grammi": grammi a mano, con accanto le percentuali che ne risultano.
 * In entrambi i casi, sotto, il lievito.
 */
export function RecipeCard() {
  const mode = useDoughStore((s) => s.dough.recipe.mode);
  const setRecipeMode = useDoughStore((s) => s.setRecipeMode);

  return (
    <>
      <Segmented ariaLabel="Come scrivi la ricetta" value={mode} options={MODE_OPTIONS} onChange={setRecipeMode} />
      <p className="mt-2 mb-4 text-sm text-muted-foreground">
        {mode === "percent"
          ? "Dimmi quanti panetti vuoi e quanta acqua: i grammi da pesare li calcolo io."
          : "Scrivi i grammi che metti nella vasca. Biga e lievito madre vanno al punto 3, non qui."}
      </p>
      {mode === "percent" ? <PercentRecipe /> : <GramsRecipe />}
      <YeastFields />
    </>
  );
}

function PercentRecipe() {
  const dough = useDoughStore((s) => s.dough);
  const setRecipe = useDoughStore((s) => s.setRecipe);
  const setField = useDoughStore((s) => s.setField);
  const a = useDoughAnalysis();
  const r = dough.recipe;
  const sugg = a.flours.loading ? null : suggestedHydration(a.flours.profile.absorption?.value);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Panetti" unit="pz" value={r.pieces} onChange={(v) => setRecipe({ pieces: v })} />
        <NumberField label="Peso panetto" unit="g" value={dough.pieceWeight} onChange={(v) => setField("pieceWeight", v)} />
        <NumberField
          label="Idratazione"
          unit="%"
          value={r.hydration}
          onChange={(v) => setRecipe({ hydration: v })}
          hint={r.hydration ? `${fmt(r.hydration)} g d’acqua ogni 100 g di farina` : "acqua ogni 100 g di farina"}
        />
        <NumberField label="Sale" unit="%" value={r.salt} onChange={(v) => setRecipe({ salt: v })} hint="di solito 2,5–3 %" />
        <NumberField label="Olio / grassi" unit="%" value={r.fat} onChange={(v) => setRecipe({ fat: v })} hint="0 se non lo usi" />
      </div>

      {sugg ? (
        <div className="mt-4 rounded-xl bg-accent/60 px-3 py-2.5 text-sm">
          <p>
            Le tue farine assorbono circa il <strong>{fmt(sugg.value)} %</strong> d’acqua (dalla scheda tecnica). {sugg.note}
          </p>
          {r.hydration !== sugg.value && (
            <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full" onClick={() => setRecipe({ hydration: sugg.value })}>
              Usa {fmt(sugg.value)} %
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Consiglio: scegli le tue farine al punto 1 con l’assorbimento della scheda tecnica, e ti suggerisco io l’idratazione.
        </p>
      )}

      <WeighList />
    </>
  );
}

/** "Da pesare": i grammi calcolati dalla ricetta in percentuale. */
function WeighList() {
  const dough = useDoughStore((s) => s.dough);
  const { flours } = useFlourArchive();
  const c = useDoughAnalysis().composition;
  const g = gramsFromRecipe(dough);

  if (!g) return <EmptyHint>Scrivi panetti, peso del panetto e idratazione: qui compaiono i grammi da pesare.</EmptyHint>;

  const byFlour = normalizeBlend(dough.flourBlend).map((p) => {
    const f = flours.find((x) => x.id === p.flourId);
    return { key: p.flourId, name: f ? flourDisplayName(f) : "Farina eliminata", grams: c.flour * p.share };
  });
  const yeastLabel = dough.yeastType === "dry" ? "Lievito secco" : "Lievito fresco";

  return (
    <div className="mt-4 rounded-xl border bg-muted/40 p-3">
      <p className="mb-2 font-heading text-base font-bold">Da pesare in vasca</p>
      {g.prefermentTooBig && (
        <p className="mb-2 flex gap-2 rounded-lg bg-warm/15 px-2.5 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />I prefermenti contengono già più farina o acqua di quella che serve: aumenta i panetti o riduci il prefermento.
        </p>
      )}
      <dl className="flex flex-col gap-1.5 text-sm tabular-nums">
        <Row label="Farina" value={`${fmt(c.flour)} g`} strong />
        {byFlour.map((f) => (
          <Row key={f.key} label={byFlour.length > 1 ? `di cui ${f.name}` : `tutta ${f.name}`} value={byFlour.length > 1 ? `${fmt(f.grams)} g` : ""} sub />
        ))}
        <Row label="Acqua" value={`${fmt(c.water)} g`} strong />
        <Row label="Sale" value={`${fmtGrams(c.salt)} g`} />
        {c.fat > 0 && <Row label="Olio / grassi" value={`${fmtGrams(c.fat)} g`} />}
        {c.yeastRaw > 0 && <Row label={yeastLabel} value={`${fmtGrams(c.yeastRaw)} g`} />}
        {c.preferments.length > 0 && (
          <Row
            label={`+ prefermenti (già con ${fmt(c.prefermentFlour)} g di farina e ${fmt(c.prefermentWater)} g d’acqua)`}
            value={`${fmt(c.prefermentWeight)} g`}
          />
        )}
      </dl>
      <p className="mt-3 border-t pt-2 text-sm text-muted-foreground tabular-nums">
        Impasto totale {fmt(c.totalWeight)} g = {fmt(dough.recipe.pieces ?? 0)} panetti da {fmt(dough.pieceWeight ?? 0)} g
      </p>
    </div>
  );
}

function Row({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: boolean }) {
  return (
    <div className={sub ? "-mt-1 flex justify-between gap-3 pl-3 text-xs text-muted-foreground" : "flex justify-between gap-3"}>
      <dt>{label}</dt>
      <dd className={strong ? "font-heading text-base font-extrabold" : "font-medium"}>{value}</dd>
    </div>
  );
}

function GramsRecipe() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const c = useDoughAnalysis().composition;
  const onFlour = (v: number) => (c.totalFlour > 0 ? `${fmt(percent(v, c.totalFlour), 1)} % sulla farina` : undefined);

  return (
    <div className="grid grid-cols-2 gap-3">
      <NumberField
        label="Farina"
        unit="g"
        value={dough.flour}
        onChange={(v) => setField("flour", v)}
        hint={c.prefermentFlour > 0 ? `+ ${fmt(c.prefermentFlour)} g nei prefermenti` : undefined}
      />
      <NumberField
        label="Acqua"
        unit="g"
        value={dough.water}
        onChange={(v) => setField("water", v)}
        hint={c.totalFlour > 0 ? `idratazione ${fmt(c.hydration, 1)} %` : undefined}
      />
      <NumberField label="Sale" unit="g" value={dough.salt} onChange={(v) => setField("salt", v)} hint={c.salt > 0 ? onFlour(c.salt) : undefined} />
      <NumberField label="Olio / grassi" unit="g" value={dough.fat} onChange={(v) => setField("fat", v)} hint={c.fat > 0 ? onFlour(c.fat) : undefined} />
    </div>
  );
}

function YeastFields() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const a = useDoughAnalysis();
  const suggested =
    a.yeast && dough.yeastType !== "none" && a.composition.sourdoughWeight === 0 ? yeastToApply(a.yeast.freshGrams, dough.yeastType) : null;

  return (
    <>
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
      {suggested !== null && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Per i tempi della scheda Tempi ne servono circa <strong className="text-foreground">{fmtGrams(suggested)} g</strong>.
          </span>
          {Math.abs(grams(dough.yeast) - suggested) >= 0.1 && (
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setField("yeast", suggested)}>
              Usa {fmtGrams(suggested)} g
            </Button>
          )}
        </div>
      )}
    </>
  );
}
