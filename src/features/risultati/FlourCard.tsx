import { Link } from "react-router";
import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Flags } from "@/components/Flags";
import { fmt } from "@/domain/format";
import { plNote, type ProfileValue } from "@/domain/miscela";
import { flourDisplayName } from "@/domain/presets";
import { useDoughAnalysis } from "@/state/doughStore";
import { SectionTitle } from "./ResultHero";

/** Profilo della miscela di farine e ripartizione tra vasca e prefermenti. */
export function FlourCard() {
  const a = useDoughAnalysis();
  const { distribution, profile, flags } = a.flours;
  const hasBlend = distribution.usages.length > 0;

  return (
    <Card className="mb-4 gap-0 py-0">
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Layers className="size-[1.1rem]" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold">Farine</h3>
            <p className="text-sm text-muted-foreground">Profilo della miscela, pesato sui grammi di ogni farina.</p>
          </div>
        </div>

        {a.flours.loading ? (
          <p className="mt-4 py-4 text-center text-sm text-muted-foreground">Caricamento delle farine…</p>
        ) : !hasBlend ? (
          <p className="mt-4 rounded-xl border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
            Nessuna miscela: scegli le farine nella scheda{" "}
            <Link to="/impasto" className="font-medium text-foreground underline underline-offset-4">
              Impasto
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProfileStat label="Forza (W)" v={profile.w} format={(n) => fmt(n, 0)} />
              <ProfileStat label="P/L" v={profile.pl} format={(n) => fmt(n, 2)} note={profile.pl ? plNote(profile.pl.value) : undefined} />
              <ProfileStat label="Proteine" v={profile.protein} format={(n) => `${fmt(n, 1)} %`} note="tal quale" />
              <ProfileStat label="Assorbimento" v={profile.absorption} format={(n) => `${fmt(n, 0)} %`} />
            </div>

            <SectionTitle>Ripartizione</SectionTitle>
            <ul className="flex flex-col gap-3">
              {distribution.usages.map((u) => (
                <li key={u.flourId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{u.flour ? flourDisplayName(u.flour) : "Farina eliminata"}</span>
                    <span className="shrink-0 tabular-nums">
                      {fmt(u.grams)} g · <span className="text-muted-foreground">{fmt(u.percent, 0)} %</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="bg-flour" style={{ width: `${(u.mainGrams / Math.max(1, a.composition.totalFlour)) * 100}%` }} />
                    <div className="bg-preferment" style={{ width: `${(u.prefermentGrams / Math.max(1, a.composition.totalFlour)) * 100}%` }} />
                  </div>
                  {u.prefermentGrams > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {fmt(u.mainGrams)} g in vasca · {fmt(u.prefermentGrams)} g nei prefermenti
                    </p>
                  )}
                </li>
              ))}
              {distribution.unassignedGrams > 0 && (
                <li className="flex justify-between text-sm text-muted-foreground tabular-nums">
                  <span>Senza miscela</span>
                  <span>{fmt(distribution.unassignedGrams)} g</span>
                </li>
              )}
            </ul>
          </>
        )}

        <Flags flags={flags} className="mt-4" />
      </CardContent>
    </Card>
  );
}

function ProfileStat({ label, v, format, note }: { label: string; v: ProfileValue | null; format: (n: number) => string; note?: string }) {
  const partial = v && v.coverage < 0.999;
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl leading-tight font-extrabold tabular-nums">
        {v ? format(v.value) : "—"}
        {partial && <span className="ml-1 align-top text-xs font-medium text-warm">parziale</span>}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{v ? (note ?? " ") : "dato mancante"}</p>
    </div>
  );
}
