import type { NormalizedPhase } from "./lievito";

export type ScheduleStep =
  | { kind: "start"; label: string; at: Date }
  | { kind: "phase"; label: string; at: Date; hours: number; temp: number }
  | { kind: "ready"; label: string; at: Date };

/** Interpreta "YYYY-MM-DDTHH:mm" come ora locale. null se vuoto o non valido. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Programma orario: inizio impasto, inizio di ogni fase, momento in cui è pronto da cuocere. */
export function buildSchedule(start: string, phases: NormalizedPhase[]): ScheduleStep[] | null {
  const startDate = parseLocalDateTime(start);
  const active = phases.filter((p) => p.hours > 0);
  if (!startDate || active.length === 0) return null;

  const steps: ScheduleStep[] = [{ kind: "start", label: "Impasto", at: startDate }];
  let t = startDate.getTime();
  for (const p of active) {
    steps.push({ kind: "phase", label: p.name, at: new Date(t), hours: p.hours, temp: p.temp });
    t += p.hours * 3_600_000;
  }
  steps.push({ kind: "ready", label: "Pronto da cuocere", at: new Date(t) });
  return steps;
}

/** "lun 23, 08:00": giorno abbreviato, numero e ora. */
export function formatScheduleTime(d: Date): string {
  return d.toLocaleString("it-IT", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
