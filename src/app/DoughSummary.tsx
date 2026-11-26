import { fmt, fmtGrams } from "@/domain/format";
import { useDoughAnalysis } from "@/state/doughStore";

/** Tre numeri chiave sempre visibili sotto l'intestazione, in ogni scheda. */
export function DoughSummary() {
  const a = useDoughAnalysis();
  const c = a.composition;
  const items = [
    { label: "idratazione totale", value: c.totalFlour > 0 ? `${fmt(c.hydration, 1)} %` : "—" },
    { label: "peso impasto", value: c.totalWeight > 0 ? `${fmt(c.totalWeight)} g` : "—" },
    { label: "lievito consigliato", value: a.yeast ? `${fmtGrams(a.yeast.freshGrams)} g` : "—" },
  ];
  return (
    <dl className="mx-auto grid max-w-xl grid-cols-3 gap-2 px-4 pb-3" aria-live="polite">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col-reverse rounded-xl bg-muted/60 px-3 py-2">
          <dt className="text-[0.7rem] leading-tight text-muted-foreground">{i.label}</dt>
          <dd className="font-heading text-lg leading-tight font-extrabold tabular-nums">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
