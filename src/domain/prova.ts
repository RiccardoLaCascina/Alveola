import { z } from "zod";
import { DoughSchema, FlourSchema, type Dough, type Flour } from "./model";
import type { DoughAnalysis } from "./analisi";
import { newId } from "./presets";

/*
  Una prova del diario.
  Si registra in due momenti:
  1. all'impasto: fotografia della ricetta e delle farine usate + temperature misurate;
  2. dopo la cottura: voti da 1 a 5 e commento.
  La fotografia (snapshot) non cambia più: se domani modifichi la ricetta o una farina in archivio,
  la prova di oggi resta com'era. È questo che permette di confrontare le prove nel tempo
  (e, più avanti, all'AI di imparare dai risultati del pizzaiolo).
*/

export const RATING_KEYS = ["extensibility", "rim", "crumb", "bake"] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

export const RATING_LABELS: Record<RatingKey, { label: string; hint: string }> = {
  extensibility: { label: "Estensibilità e lavorabilità", hint: "Come si stende: si strappa, ritira o si apre bene" },
  rim: { label: "Sviluppo del cornicione", hint: "Quanto cresce e si gonfia il bordo in forno" },
  crumb: { label: "Alveolatura", hint: "Mollica in sezione: alveoli regolari, aperti o chiusi" },
  bake: { label: "Cottura e croccantezza", hint: "Colore, maculatura, croccante fuori e morbido dentro" },
};

const value = z.number().nullable();
const rating = z.number().int().min(1).max(5).nullable();

export const TRIAL_STATUSES = ["toRate", "done"] as const;
export type TrialStatus = (typeof TRIAL_STATUSES)[number];

/** Numeri chiave calcolati al momento della prova (le formule potrebbero cambiare in futuro: li conserviamo). */
export const TrialSummarySchema = z.object({
  hydration: value,
  totalWeight: value,
  pieces: value,
  suggestedYeastGrams: value,
  equivalentHours: value,
  totalHours: value,
  effectiveW: value,
  waterTempSuggested: value,
  plannedStart: z.string(),
  plannedBalling: z.string(),
  plannedReady: z.string(),
});

export const TrialSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.enum(TRIAL_STATUSES),
  /** nome breve facoltativo, es. "Napoletana 48 h, prova manitoba 30 %" */
  title: z.string(),
  /** fotografia della ricetta */
  dough: DoughSchema,
  /** fotografia delle farine dell'archivio usate nella miscela */
  flours: z.array(FlourSchema),
  summary: TrialSummarySchema,
  /** misure reali in laboratorio, °C e % */
  measured: z.object({
    waterTemp: value,
    doughTemp: value,
    ambientTemp: value,
    ambientHumidity: value,
  }),
  /** note scritte all'impasto */
  mixingNotes: z.string(),
  ratings: z.object({
    extensibility: rating,
    rim: rating,
    crumb: rating,
    bake: rating,
  }),
  /** commento dopo la cottura */
  comment: z.string(),
  /** quando è stata valutata (ms) */
  ratedAt: z.number().nullable(),
});

export type Trial = z.infer<typeof TrialSchema>;
export type TrialMeasured = Trial["measured"];
export type TrialRatings = Trial["ratings"];

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : "");

/** Farine dell'archivio usate nella miscela dell'impasto o dei prefermenti. */
export function floursUsedBy(d: Dough, archive: Flour[]): Flour[] {
  const ids = new Set([...d.flourBlend, ...d.preferments.flatMap((p) => p.flourBlend)].map((b) => b.flourId));
  return archive.filter((f) => ids.has(f.id));
}

/** Crea una prova dall'impasto di oggi (momento 1). */
export function createTrial(input: {
  dough: Dough;
  archive: Flour[];
  analysis: DoughAnalysis;
  measured: TrialMeasured;
  title?: string;
  mixingNotes?: string;
  now?: number;
}): Trial {
  const { dough, analysis: a } = input;
  const now = input.now ?? Date.now();
  return TrialSchema.parse({
    id: newId(),
    createdAt: now,
    updatedAt: now,
    status: "toRate",
    title: input.title?.trim() ?? "",
    dough: structuredClone(dough),
    flours: structuredClone(floursUsedBy(dough, input.archive)),
    summary: {
      hydration: a.composition.totalFlour > 0 ? a.composition.hydration : null,
      totalWeight: a.composition.totalWeight || null,
      pieces: a.portion?.pieces ?? null,
      suggestedYeastGrams: a.yeast?.freshGrams ?? null,
      equivalentHours: a.maturation.equivalentHours || null,
      totalHours: a.maturation.totalHours || null,
      effectiveW: a.flours.effectiveW.value,
      waterTempSuggested: a.waterTemp,
      plannedStart: iso(a.schedule?.start),
      plannedBalling: iso(a.schedule?.balling),
      plannedReady: iso(a.schedule?.ready),
    },
    measured: input.measured,
    mixingNotes: input.mixingNotes?.trim() ?? "",
    ratings: { extensibility: null, rim: null, crumb: null, bake: null },
    comment: "",
    ratedAt: null,
  });
}

/** Media dei voti dati (null se nessun voto). */
export function averageRating(r: TrialRatings): number | null {
  const given = RATING_KEYS.map((k) => r[k]).filter((v): v is number => v != null);
  return given.length ? given.reduce((s, v) => s + v, 0) / given.length : null;
}

/** Valutazione dopo la cottura (momento 2): la prova passa a "completata" quando ha tutti i voti. */
export function rateTrial(t: Trial, ratings: TrialRatings, comment: string, now: number = Date.now()): Trial {
  const complete = RATING_KEYS.every((k) => ratings[k] != null);
  return TrialSchema.parse({
    ...t,
    ratings,
    comment: comment.trim(),
    status: complete ? "done" : "toRate",
    ratedAt: complete ? now : t.ratedAt,
    updatedAt: now,
  });
}

/**
 * Scarto tra la temperatura finale voluta e quella misurata, °C (positivo = impasto più caldo del voluto).
 * È il primo dato che dice se la prova è "confrontabile" con le altre.
 */
export function doughTempDeviation(t: Trial): number | null {
  const target = t.dough.targetDoughTemp;
  const measured = t.measured.doughTemp;
  return target != null && measured != null ? measured - target : null;
}
