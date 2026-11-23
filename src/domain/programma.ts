import type { Flag, Plan } from "./model";
import type { NormalizedPhase } from "./lievito";
import { fmt } from "./format";

export type ScheduleStep =
  | { kind: "start"; label: string; at: Date }
  | { kind: "phase"; label: string; at: Date; hours: number; temp: number; balled: boolean; adapted: boolean }
  | { kind: "balling"; label: string; at: Date }
  | { kind: "ready"; label: string; at: Date };

export type DoughPlan = {
  mode: Plan["mode"];
  /** quando impastare */
  start: Date;
  /** quando fare lo staglio (le palline); null se nessuna fase è "in panetti" */
  balling: Date | null;
  /** quando l'impasto è pronto da cuocere */
  ready: Date;
  steps: ScheduleStep[];
};

const HOUR = 3_600_000;
const MINUTE = 60_000;
/** Gli orari del programma sono arrotondati al minuto (le ore frazionarie danno millisecondi inutili). */
const toMinute = (t: number) => new Date(Math.round(t / MINUTE) * MINUTE);

/** Interpreta "YYYY-MM-DDTHH:mm" come ora locale. null se vuoto o non valido. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Data nel formato di <input type="datetime-local">, ora locale. */
export function toLocalDateTimeValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Programma a partire dall'ora di inizio: impasto, fasi, staglio prima della prima fase in panetti, pronto. */
function scheduleFrom(start: Date, phases: NormalizedPhase[]): Omit<DoughPlan, "mode"> | null {
  const active = phases.filter((p) => p.hours > 0);
  if (active.length === 0) return null;

  const startAt = toMinute(start.getTime());
  const steps: ScheduleStep[] = [{ kind: "start", label: "Impasto", at: startAt }];
  let t = startAt.getTime();
  let balling: Date | null = null;
  for (const p of active) {
    if (p.balled && !balling) {
      balling = toMinute(t);
      steps.push({ kind: "balling", label: "Staglio", at: balling });
    }
    steps.push({ kind: "phase", label: p.name, at: toMinute(t), hours: p.hours, temp: p.temp, balled: p.balled, adapted: p.adapted });
    t += p.hours * HOUR;
  }
  const ready = toMinute(t);
  steps.push({ kind: "ready", label: "Pronto da cuocere", at: ready });
  return { start: startAt, balling, ready, steps };
}

/**
 * Programma della giornata.
 * - forward: dall'ora di inizio impasto in avanti;
 * - backward: dall'ora in cui si vuole l'impasto pronto, all'indietro → a che ora impastare e fare lo staglio.
 * null se manca l'ora di riferimento o non ci sono fasi con durata.
 */
export function buildPlan(plan: Plan, start: string, phases: NormalizedPhase[]): DoughPlan | null {
  const total = phases.reduce((s, p) => s + p.hours, 0);
  if (total <= 0) return null;
  if (plan.mode === "backward") {
    const target = parseLocalDateTime(plan.targetReady);
    if (!target) return null;
    const s = scheduleFrom(new Date(target.getTime() - total * HOUR), phases);
    return s && { mode: "backward", ...s };
  }
  const startDate = parseLocalDateTime(start);
  if (!startDate) return null;
  const s = scheduleFrom(startDate, phases);
  return s && { mode: "forward", ...s };
}

/** "lun 23, 08:00": giorno abbreviato, numero e ora. */
export function formatScheduleTime(d: Date): string {
  return d.toLocaleString("it-IT", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "08:00": solo l'ora. */
export function formatClock(d: Date): string {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

/** Sotto questa variazione (frazione) non vale la pena segnalare un adattamento dei tempi. */
const NEGLIGIBLE = 0.05;

/**
 * Avvisi su ambiente e pianificazione:
 * temperatura del laboratorio, umidità, fasi adattate, staglio mancante.
 */
export function planningFlags(
  phases: NormalizedPhase[],
  ambientTemp: number | null,
  ambientHumidity: number | null,
  adapt: Plan["adapt"],
): Flag[] {
  const flags: Flag[] = [];
  const ambientPhases = phases.filter((p) => p.ambient && p.plannedHours > 0);

  if (ambientPhases.length && ambientTemp == null)
    flags.push({ tone: "info", message: "Inserisci la temperatura del laboratorio di oggi per adattare puntata e appretto." });

  if (ambientTemp != null && !ambientPhases.length && phases.some((p) => p.plannedHours > 0))
    flags.push({
      tone: "warning",
      message: "Nessuna fase è segnata “A temperatura ambiente”: la temperatura del laboratorio non viene usata. Segnalo su puntata e appretto.",
    });

  if (ambientTemp != null && ambientPhases.length) {
    if (ambientTemp > 30)
      flags.push({ tone: "warning", message: `Laboratorio a ${fmt(ambientTemp, 0)} °C: il lievito corre molto, controlla spesso l’impasto e valuta il frigo.` });
    else if (ambientTemp < 16)
      flags.push({ tone: "warning", message: `Laboratorio a ${fmt(ambientTemp, 0)} °C: le fasi ambiente saranno lente, valuta una cella di lievitazione.` });
  }

  if (adapt === "times") {
    const changed = ambientPhases.filter((p) => p.adapted && Math.abs(p.hours / p.plannedHours - 1) > NEGLIGIBLE);
    if (changed.length && ambientTemp != null)
      flags.push({
        tone: "info",
        message: `Con ${fmt(ambientTemp, 0)} °C in laboratorio: ${changed
          .map((p) => `${p.name} ${fmt(p.plannedHours, 1)} h → ${fmt(p.hours, 1)} h`)
          .join("; ")}.`,
      });
    const extreme = changed.filter((p) => p.hours / p.plannedHours > 2 || p.hours / p.plannedHours < 0.5);
    if (extreme.length)
      flags.push({
        tone: "warning",
        message: "Alcune fasi cambiano più del doppio: con una differenza di temperatura così grande conviene adattare il lievito invece dei tempi.",
      });
  }

  if (ambientHumidity != null) {
    if (ambientHumidity < 40)
      flags.push({ tone: "info", message: `Aria secca (${fmt(ambientHumidity, 0)} %): copri bene massa e panetti, la superficie fa presto la pelle.` });
    else if (ambientHumidity > 75)
      flags.push({
        tone: "info",
        message: `Aria umida (${fmt(ambientHumidity, 0)} %): l’impasto risulta più appiccicoso; valuta 1–2 punti d’acqua in meno e uno spolvero in più allo staglio.`,
      });
  }

  if (phases.some((p) => p.hours > 0) && !phases.some((p) => p.balled && p.hours > 0))
    flags.push({ tone: "info", message: "Nessuna fase in panetti: segna “In panetti” sulla fase dopo lo staglio per sapere quando fare le palline." });

  return flags;
}
