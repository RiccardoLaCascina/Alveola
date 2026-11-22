import type { ReactNode } from "react";

/** Testata scura delle card risultato: etichetta, numero grande, nota. */
export function ResultHero({ label, value, unit, note }: { label: string; value: string | null; unit?: string; note: ReactNode }) {
  return (
    <div className="bg-linear-to-br from-primary/25 via-primary/10 to-transparent px-5 pt-5 pb-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-6xl leading-none font-extrabold tracking-tight tabular-nums">
        {value ?? "—"}
        {value && unit && <span className="ml-1 text-2xl font-bold text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2 font-heading text-base font-bold">{children}</h3>;
}
