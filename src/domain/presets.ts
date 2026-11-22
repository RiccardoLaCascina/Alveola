import type { Dough, MixerType, Phase, Preferment, PrefermentType } from "./model";

type PrefermentPreset = {
  label: string;
  weight: number;
  hydration: number;
  yeast: number;
  /** lievito madre: lievita da solo, niente lievito di birra */
  sourdough: boolean;
};

export const PREFERMENT_PRESETS: Record<PrefermentType, PrefermentPreset> = {
  biga: { label: "Biga", weight: 450, hydration: 45, yeast: 3, sourdough: false },
  poolish: { label: "Poolish", weight: 400, hydration: 100, yeast: 0.4, sourdough: false },
  lmSolid: { label: "Lievito madre solido", weight: 200, hydration: 50, yeast: 0, sourdough: true },
  lmLiquid: { label: "Lievito madre liquido", weight: 200, hydration: 100, yeast: 0, sourdough: true },
  custom: { label: "Altro prefermento", weight: 200, hydration: 60, yeast: 0, sourdough: false },
};

/** Nome breve per i pulsanti "aggiungi". */
export const PREFERMENT_SHORT_LABEL: Record<PrefermentType, string> = {
  biga: "Biga",
  poolish: "Poolish",
  lmSolid: "Madre solido",
  lmLiquid: "Madre liquido",
  custom: "Altro",
};

/** Riscaldamento dell'impasto dovuto all'impastatrice, °C. */
export const MIXERS: Record<MixerType, { label: string; heatRise: number }> = {
  hand: { label: "A mano", heatRise: 1 },
  fork: { label: "Forcella", heatRise: 3 },
  diving: { label: "Bracci tuffanti", heatRise: 3.5 },
  planetary: { label: "Planetaria", heatRise: 4 },
  spiral: { label: "Spirale", heatRise: 5 },
};

export const PHASE_PRESETS: { label: string; name: string; hours: number; temp: number }[] = [
  { label: "Puntata", name: "Puntata", hours: 2, temp: 22 },
  { label: "Frigo", name: "Maturazione in frigo", hours: 24, temp: 4 },
  { label: "Appretto", name: "Appretto", hours: 4, temp: 22 },
  { label: "Altra", name: "Nuova fase", hours: 1, temp: 20 },
];

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function isSourdough(type: PrefermentType): boolean {
  return PREFERMENT_PRESETS[type].sourdough;
}

export function createPreferment(type: PrefermentType): Preferment {
  const p = PREFERMENT_PRESETS[type];
  return { id: newId(), type, weight: p.weight, hydration: p.hydration, yeast: p.yeast };
}

export function createPhase(name: string, hours: number, temp: number): Phase {
  return { id: newId(), name, hours, temp };
}

/** Ora locale arrotondata al quarto d'ora successivo, nel formato di <input type="datetime-local">. */
export function nextQuarterHour(now: Date = new Date()): string {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Impasto di esempio con cui parte l'app (stessi valori della prima versione). */
export function createDefaultDough(now: Date = new Date()): Dough {
  return {
    flour: 1000,
    water: 650,
    salt: 28,
    fat: 0,
    yeastType: "fresh",
    yeast: 2,
    pieceWeight: 270,
    preferments: [],
    phases: [
      createPhase("Puntata", 2, 22),
      createPhase("Maturazione in frigo", 24, 4),
      createPhase("Appretto", 4, 22),
    ],
    targetDoughTemp: 24,
    flourTemp: 20,
    prefermentTemp: 18,
    mixer: "spiral",
    flourW: null,
    start: nextQuarterHour(now),
  };
}
