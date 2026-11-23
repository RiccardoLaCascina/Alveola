import type { AdaptMode, Phase } from "./model";
import { grams } from "./impasto";

/** Temperatura di riferimento del modello, °C. */
export const REFERENCE_TEMP = 24;
/** Sotto queste ore equivalenti la stima del lievito è poco affidabile. */
export const MIN_RELIABLE_EQUIVALENT_HOURS = 1.5;
/** Sotto questa temperatura una fase conta come "al freddo". */
export const COLD_THRESHOLD = 10;

/**
 * Attività del lievito rispetto a 24 °C.
 * Raddoppia circa ogni 7 °C, è quasi ferma sotto i 2 °C, non cresce oltre i 35 °C.
 */
export function yeastActivity(tempC: number): number {
  if (tempC <= 1) return 0.03;
  const t = Math.min(tempC, 35);
  return Math.pow(2, (t - REFERENCE_TEMP) / 7);
}

/** Lievito fresco consigliato, % sulla farina totale, in funzione delle ore equivalenti a 24 °C (curva empirica). */
export function suggestedFreshYeastPercent(equivalentHours: number): number {
  return Math.min(4, Math.max(0.02, 3.87 * Math.pow(equivalentHours, -1.37)));
}

export type NormalizedPhase = {
  id: string;
  name: string;
  /** durata effettiva (eventualmente adattata alla temperatura di oggi), ore */
  hours: number;
  /** temperatura effettiva, °C */
  temp: number;
  /** durata e temperatura scritte nella ricetta */
  plannedHours: number;
  plannedTemp: number;
  ambient: boolean;
  balled: boolean;
  /** true se durata o temperatura sono state cambiate per l'ambiente di oggi */
  adapted: boolean;
};

export type MaturationContext = {
  /** temperatura del laboratorio oggi; null = usa le temperature previste */
  ambientTemp?: number | null;
  adapt?: AdaptMode;
};

export type MaturationSummary = {
  phases: NormalizedPhase[];
  totalHours: number;
  coldHours: number;
  /** ore che la maturazione "vale" se fosse tutta a 24 °C */
  equivalentHours: number;
};

/**
 * Normalizza una fase (campi vuoti: durata 0, temperatura 20 °C, nome "Fase") e,
 * se è una fase ambiente e conosciamo la temperatura di oggi, la adatta:
 * - adapt "yeast": stessa durata, temperatura di oggi (cambierà la dose di lievito consigliata);
 * - adapt "times": durata scalata perché la fase "valga" lo stesso: h' = h × attività(prevista) / attività(oggi).
 */
export function normalizePhase(p: Phase, ctx: MaturationContext = {}): NormalizedPhase {
  const plannedHours = grams(p.hours);
  const plannedTemp = p.temp ?? 20;
  const base: NormalizedPhase = {
    id: p.id,
    name: p.name.trim() || "Fase",
    hours: plannedHours,
    temp: plannedTemp,
    plannedHours,
    plannedTemp,
    ambient: p.ambient,
    balled: p.balled,
    adapted: false,
  };
  const today = ctx.ambientTemp;
  if (!p.ambient || today == null || !Number.isFinite(today) || today === plannedTemp) return base;
  if (ctx.adapt === "times") {
    const hours = (plannedHours * yeastActivity(plannedTemp)) / yeastActivity(today);
    return { ...base, hours, temp: today, adapted: true };
  }
  return { ...base, temp: today, adapted: true };
}

export function maturationSummary(phases: Phase[], ctx: MaturationContext = {}): MaturationSummary {
  const normalized = phases.map((p) => normalizePhase(p, ctx));
  let totalHours = 0;
  let coldHours = 0;
  let equivalentHours = 0;
  for (const p of normalized) {
    totalHours += p.hours;
    equivalentHours += p.hours * yeastActivity(p.temp);
    if (p.temp < COLD_THRESHOLD) coldHours += p.hours;
  }
  return { phases: normalized, totalHours, coldHours, equivalentHours };
}

export type TempBand = "cold" | "mild" | "warm";
/** Fascia di colore della temperatura: sotto 10 °C, 10–20 °C, da 20 °C. */
export function tempBand(tempC: number): TempBand {
  return tempC < 10 ? "cold" : tempC < 20 ? "mild" : "warm";
}
