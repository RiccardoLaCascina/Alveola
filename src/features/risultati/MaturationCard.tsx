import { Clock, Droplet, Flame, Scissors, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flags } from "@/components/Flags";
import { BAND_BG, BAND_LABEL } from "@/components/tempBand";
import { fmt, fmtGrams } from "@/domain/format";
import { tempBand, type TempBand } from "@/domain/lievito";
import { yeastToApply } from "@/domain/analisi";
import { formatScheduleTime } from "@/domain/programma";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { cn } from "@/lib/utils";
import { ResultHero, SectionTitle } from "./ResultHero";

const BANDS: TempBand[] = ["cold", "mild", "warm"];

export function MaturationCard() {
  const a = useDoughAnalysis();
  const yeastType = useDoughStore((s) => s.dough.yeastType);
  const setField = useDoughStore((s) => s.setField);
  const m = a.maturation;
  const activePhases = m.phases.filter((p) => p.hours > 0);

  const yeastNote = a.yeast
    ? `${fmt(a.yeast.percent, 2)} % sulla farina totale · secco ${fmt(a.yeast.dryGrams, 1)} g`
    : m.equivalentHours > 0
      ? "Inserisci la farina per calcolare la dose."
      : "Aggiungi le fasi di maturazione.";

  const applyYeast = () => {
    if (!a.yeast) return;
    const value = yeastToApply(a.yeast.freshGrams, yeastType);
    setField("yeast", value);
    toast.success(`Lievito impostato a ${fmt(value, 1)} g ${yeastType === "dry" ? "di secco" : "di fresco"}.`);
  };

  return (
    <Card className="mb-4 gap-0 overflow-hidden py-0">
      <ResultHero label="Lievito fresco consigliato" value={a.yeast ? fmtGrams(a.yeast.freshGrams) : null} unit="g" note={yeastNote} />

      {m.totalHours > 0 && (
        <div className="flex h-10 bg-muted" aria-hidden="true">
          {activePhases.map((p) => (
            <div
              key={p.id}
              title={`${p.name}: ${fmt(p.hours, 1)} h a ${fmt(p.temp, 0)} °C`}
              className={cn(
                "flex min-w-1 items-center justify-center overflow-hidden border-r-2 border-card text-xs font-bold whitespace-nowrap text-black/75 last:border-r-0",
                BAND_BG[tempBand(p.temp)],
              )}
              style={{ flex: p.hours }}
            >
              {p.hours / m.totalHours > 0.12 && `${fmt(p.hours, 1)} h`}
            </div>
          ))}
        </div>
      )}

      <CardContent className="py-5">
        {m.totalHours > 0 && (
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {BANDS.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-sm", BAND_BG[b])} />
                {BAND_LABEL[b]}
              </span>
            ))}
          </div>
        )}

        {a.yeast && (
          <table className="w-full text-sm tabular-nums">
            <tbody>
              {[
                ["Durata totale", `${fmt(m.totalHours, 1)} h`],
                ["Di cui al freddo", `${fmt(m.coldHours, 1)} h`],
                ["Equivalenti a 24 °C", `${fmt(m.equivalentHours, 1)} h`],
                ["Lievito nell’impasto ora", `${fmt(a.composition.mainFreshYeast, 1)} g · ${fmt(a.yeast.currentPercent, 2)} %`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-border/70 last:border-b-0">
                  <td className="py-2.5">{k}</td>
                  <td className="py-2.5 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Button size="lg" className="mt-4 h-12 w-full rounded-xl text-base" disabled={!a.yeast || yeastType === "none"} onClick={applyYeast}>
          Usa questa dose nell’impasto
        </Button>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat
            icon={Droplet}
            label="Temperatura dell’acqua"
            value={a.waterTemp !== null ? `${fmt(a.waterTemp, 0)} °C` : "—"}
            note={a.waterTemp !== null ? "per la temperatura finale voluta" : "Inserisci le temperature e l’acqua."}
          />
          <Stat
            icon={Wheat}
            label="Forza consigliata"
            value={a.recommendedW ? `W ${a.recommendedW.min}–${a.recommendedW.max}` : "—"}
            note={a.recommendedW ? a.recommendedW.label + (a.recommendedW.raisedForHydration ? ", alzata per l’alta idratazione" : "") : "Aggiungi le fasi."}
          />
        </div>

        <Flags flags={a.maturationFlags} className="mt-4" />

        <SectionTitle>Programma</SectionTitle>
        {a.schedule ? (
          <ol className="relative ml-2 border-l border-border pl-5">
            {a.schedule.steps.map((s, i) => {
              const strong = s.kind === "ready" || s.kind === "balling" || s.kind === "start";
              return (
                <li key={i} className="relative pb-4 last:pb-0">
                  <span
                    className={cn(
                      "absolute top-1 -left-[1.6rem] grid size-3 place-items-center rounded-full ring-4 ring-card",
                      s.kind === "phase" ? BAND_BG[tempBand(s.temp)] : s.kind === "start" ? "bg-foreground" : "bg-primary",
                    )}
                  />
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={cn(strong && "font-bold")}>
                      {s.kind === "ready" && <Flame className="mr-1 inline size-4 text-primary" />}
                      {s.kind === "balling" && <Scissors className="mr-1 inline size-4 text-primary" />}
                      {s.label}
                      {s.kind === "phase" && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {fmt(s.hours, 1)} h a {fmt(s.temp, 0)} °C{s.balled ? " · in panetti" : ""}
                          {s.adapted ? " · adattata a oggi" : ""}
                        </span>
                      )}
                    </span>
                    <span className={cn("shrink-0 tabular-nums", strong ? "font-bold" : "text-muted-foreground")}>{formatScheduleTime(s.at)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> Imposta il programma nella scheda Tempi.
          </p>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Le dosi sono stime da un modello di attività del lievito in funzione di tempo e temperatura: usale come punto di partenza e correggi con le tue prove.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value, note }: { icon: typeof Droplet; label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 font-heading text-xl leading-tight font-extrabold whitespace-nowrap tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
