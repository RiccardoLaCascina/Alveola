import { CalendarClock, Flame, Scissors, Wheat } from "lucide-react";
import { Block } from "@/components/Block";
import { Flags } from "@/components/Flags";
import { Segmented } from "@/components/form/Segmented";
import { TextField } from "@/components/form/TextField";
import type { PlanMode } from "@/domain/model";
import { formatClock } from "@/domain/programma";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { cn } from "@/lib/utils";
import { useNow } from "@/lib/useNow";

const MODE_OPTIONS: { value: PlanMode; label: string }[] = [
  { value: "backward", label: "Pronto alle…" },
  { value: "forward", label: "Parto alle…" },
];

const dayLabel = (d: Date) => d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

/** Programma: in avanti dall'ora di inizio, oppure all'indietro dall'ora in cui si vuole l'impasto pronto. */
export function PlanBlock() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const setPlan = useDoughStore((s) => s.setPlan);
  const a = useDoughAnalysis();
  const plan = a.schedule;
  const backward = dough.plan.mode === "backward";
  // "adesso" serve solo a dire se l'ora di inizio calcolata è già passata (si aggiorna da solo)
  const now = useNow();
  const startInPast = backward && plan && plan.start.getTime() < now;

  return (
    <Block icon={CalendarClock} title="Programma" hint="Dimmi quando vuoi l’impasto pronto e ti dico quando impastare e quando fare le palline.">
      <Segmented ariaLabel="Come pianificare" value={dough.plan.mode} options={MODE_OPTIONS} onChange={(mode) => setPlan({ mode })} />

      <div className="mt-3">
        {backward ? (
          <TextField label="Pronto da cuocere alle" type="datetime-local" value={dough.plan.targetReady} onChange={(v) => setPlan({ targetReady: v })} />
        ) : (
          <TextField label="Inizio impasto" type="datetime-local" value={dough.start} onChange={(v) => setField("start", v)} />
        )}
      </div>

      {plan ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Moment icon={Wheat} label="Impasta" at={plan.start} highlight={backward} />
          <Moment icon={Scissors} label="Staglio" at={plan.balling} highlight={backward} />
          <Moment icon={Flame} label="Pronto" at={plan.ready} highlight={!backward} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {backward ? "Scegli giorno e ora in cui vuoi l’impasto pronto." : "Imposta l’ora di inizio."} Servono anche le fasi con la loro durata.
        </p>
      )}

      {startInPast && (
        <Flags
          className="mt-3"
          flags={[{ tone: "warning", message: "L’ora di impasto calcolata è già passata: sposta l’orario obiettivo o accorcia le fasi." }]}
        />
      )}
      <Flags flags={a.planningFlags} className="mt-3" />
    </Block>
  );
}

function Moment({ icon: Icon, label, at, highlight }: { icon: typeof Wheat; label: string; at: Date | null; highlight: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl p-2.5 min-[380px]:p-3", highlight ? "bg-primary/15" : "bg-muted/50")}>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" /> {label}
      </p>
      {/* l'ora si rimpicciolisce sugli schermi stretti invece di uscire dal riquadro */}
      <p className="mt-1 font-heading text-[clamp(1.05rem,5.6vw,1.5rem)] leading-tight font-extrabold tabular-nums">
        {at ? formatClock(at) : "—"}
      </p>
      <p className="text-xs text-muted-foreground first-letter:uppercase">{at ? dayLabel(at) : "nessuna fase in panetti"}</p>
    </div>
  );
}
