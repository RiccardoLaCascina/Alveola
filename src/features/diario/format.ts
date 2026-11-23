import type { Trial } from "@/domain/prova";

/** "lun 23 nov, 08:15" */
export function formatTrialDate(ms: number): string {
  return new Date(ms).toLocaleString("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Titolo della prova: quello scritto dal pizzaiolo, oppure "Prova di lun 23 nov". */
export function trialTitle(t: Trial): string {
  return t.title || `Prova di ${new Date(t.createdAt).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}`;
}

/** Ora "HH:MM" da una data ISO salvata nella prova (vuota → null). */
export function clockFromIso(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
