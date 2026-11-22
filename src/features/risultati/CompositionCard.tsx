import { Card, CardContent } from "@/components/ui/card";
import { Flags } from "@/components/Flags";
import { NumberField } from "@/components/form/NumberField";
import { fmt, fmtGrams } from "@/domain/format";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { ResultHero, SectionTitle } from "./ResultHero";

const SEGMENTS = [
  { key: "flour", label: "Farina", className: "bg-flour" },
  { key: "water", label: "Acqua", className: "bg-water" },
  { key: "preferment", label: "Prefermenti", className: "bg-preferment" },
  { key: "other", label: "Sale, lievito, grassi", className: "bg-muted-foreground/50" },
] as const;

export function CompositionCard() {
  const a = useDoughAnalysis();
  const pieceWeight = useDoughStore((s) => s.dough.pieceWeight);
  const setField = useDoughStore((s) => s.setField);
  const c = a.composition;

  const parts = {
    flour: c.flour,
    water: c.water,
    preferment: c.prefermentWeight,
    other: c.salt + c.fat + c.yeastRaw + c.prefermentYeast,
  };
  const width = (v: number) => (c.totalWeight > 0 ? `${(v / c.totalWeight) * 100}%` : "0%");

  return (
    <Card className="mb-4 gap-0 overflow-hidden py-0">
      <ResultHero label="Idratazione totale" value={c.totalFlour > 0 ? fmt(c.hydration, 1) : null} unit="%" note={a.hydrationNote} />

      <div className="flex h-3 bg-muted" aria-hidden="true">
        {SEGMENTS.map((s) => (
          <div key={s.key} className={`${s.className} transition-[width] duration-300`} style={{ width: width(parts[s.key]) }} />
        ))}
      </div>

      <CardContent className="py-5">
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${s.className}`} />
              {s.label}
            </span>
          ))}
        </div>

        <table className="w-full text-sm tabular-nums">
          <tbody>
            {a.bakers.map((r) => (
              <tr key={r.label} className="border-b border-border/70">
                <td className="py-2.5">{r.label}</td>
                <td className="py-2.5 text-right">{fmtGrams(r.grams)} g</td>
                <td className="w-20 py-2.5 text-right text-muted-foreground">{fmt(r.percent, 1)} %</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="pt-3">Peso impasto</td>
              <td className="pt-3 text-right">{fmt(c.totalWeight)} g</td>
              <td />
            </tr>
          </tbody>
        </table>

        <Flags flags={a.compositionFlags} className="mt-4" />

        <SectionTitle>Porzionatura</SectionTitle>
        <div className="grid grid-cols-2 items-end gap-3">
          <NumberField label="Peso panetto" unit="g" value={pieceWeight} onChange={(v) => setField("pieceWeight", v)} />
          <div className="pb-1 tabular-nums">
            {a.portion ? (
              <>
                <p className="font-heading text-3xl leading-tight font-extrabold">
                  {a.portion.pieces} <span className="text-lg font-bold">{a.portion.pieces === 1 ? "panetto" : "panetti"}</span>
                </p>
                <p className="text-sm text-muted-foreground">avanzano {fmt(a.portion.remainder)} g</p>
              </>
            ) : (
              <p className="font-heading text-3xl font-extrabold text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
