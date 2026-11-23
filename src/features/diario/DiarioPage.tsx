import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, NotebookPen, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/PageTitle";
import { averageRating, type Trial } from "@/domain/prova";
import { fmt } from "@/domain/format";
import { useTrials } from "@/state/trials";
import { NewTrialSheet } from "./NewTrialSheet";
import { clockFromIso, formatTrialDate, trialTitle } from "./format";

export function DiarioPage() {
  const { trials, loaded, failed } = useTrials();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageTitle title="Diario" subtitle="Ogni prova ti avvicina all’impasto perfetto." />

      <Button size="lg" className="mb-4 h-12 w-full rounded-xl text-base" onClick={() => setCreating(true)} disabled={!loaded || failed}>
        <Plus /> Registra la prova di oggi
      </Button>

      {failed ? (
        <p className="rounded-2xl bg-warm/15 p-4 text-sm">
          Il diario non è disponibile su questo dispositivo: il browser non permette di salvare dati (navigazione privata o memoria piena).
        </p>
      ) : !loaded ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Caricamento del diario…</p>
      ) : trials.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <NotebookPen className="size-7" />
            </span>
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold">Ancora nessuna prova</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                All’impasto registri ricetta e temperature misurate; dopo la cottura aggiungi voti e commento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {trials.map((t) => (
            <li key={t.id}>
              <TrialRow trial={t} />
            </li>
          ))}
        </ul>
      )}

      <NewTrialSheet open={creating} onOpenChange={setCreating} />
    </>
  );
}

function TrialRow({ trial: t }: { trial: Trial }) {
  const avg = averageRating(t.ratings);
  const balling = clockFromIso(t.summary.plannedBalling);
  const facts = [
    t.summary.hydration != null && `${fmt(t.summary.hydration, 1)} %`,
    t.summary.effectiveW != null && `W ${fmt(t.summary.effectiveW, 0)}`,
    t.summary.totalHours != null && `${fmt(t.summary.totalHours, 0)} h`,
    balling && `staglio ${balling}`,
  ].filter(Boolean) as string[];

  return (
    <Link to={`/diario/${t.id}`} className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-heading font-bold">{trialTitle(t)}</span>
          {t.status === "toRate" ? (
            <Badge className="shrink-0 bg-warm/20 text-foreground">Da valutare</Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              Completata
            </Badge>
          )}
        </span>
        <span className="block text-sm text-muted-foreground first-letter:uppercase">{formatTrialDate(t.createdAt)}</span>
        <span className="block text-xs text-muted-foreground tabular-nums">{facts.join(" · ")}</span>
      </span>
      {avg != null && (
        <span className="flex shrink-0 items-center gap-1 font-heading text-lg font-extrabold tabular-nums">
          <Star className="size-4 fill-primary text-primary" /> {fmt(avg, 1)}
        </span>
      )}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
