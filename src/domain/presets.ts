import type { Dough, Flour, FlourType, MixerType, Phase, Preferment, PrefermentType } from "./model";

export const FLOUR_TYPE_LABEL: Record<FlourType, string> = {
  "00": "Tipo 00",
  "0": "Tipo 0",
  "1": "Tipo 1",
  "2": "Tipo 2",
  integrale: "Integrale",
  semola: "Semola",
  manitoba: "Manitoba",
  altro: "Altro",
};

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

type PhasePreset = { label: string; name: string; hours: number; temp: number; ambient: boolean; balled: boolean };

/** Fasi tipiche: puntata e appretto a temperatura ambiente, frigo a temperatura fissa; l'appretto è in panetti. */
export const PHASE_PRESETS: PhasePreset[] = [
  { label: "Puntata", name: "Puntata", hours: 2, temp: 22, ambient: true, balled: false },
  { label: "Frigo", name: "Maturazione in frigo", hours: 24, temp: 4, ambient: false, balled: false },
  { label: "Appretto", name: "Appretto", hours: 4, temp: 22, ambient: true, balled: true },
  { label: "Altra", name: "Nuova fase", hours: 1, temp: 20, ambient: false, balled: false },
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
  return { id: newId(), type, weight: p.weight, hydration: p.hydration, yeast: p.yeast, flourBlend: [] };
}

/** Nuova farina vuota per il modulo di inserimento. */
export function createFlour(now: number = Date.now()): Flour {
  return {
    id: newId(),
    name: "",
    mill: "",
    type: "0",
    w: null,
    pl: null,
    protein: null,
    proteinBasis: "tq",
    absorption: null,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

/** Nome leggibile di una farina: prima il nome (la parte che distingue), poi il molino. */
export function flourDisplayName(f: Pick<Flour, "name" | "mill">): string {
  const name = f.name.trim() || "Farina senza nome";
  return f.mill.trim() ? `${name} · ${f.mill.trim()}` : name;
}

export function createPhase(name: string, hours: number, temp: number, flags: { ambient?: boolean; balled?: boolean } = {}): Phase {
  return { id: newId(), name, hours, temp, ambient: flags.ambient ?? false, balled: flags.balled ?? false };
}

/**
 * Per gli impasti salvati prima che esistessero i flag "ambiente" e "in panetti":
 * li deduciamo dal nome della fase (puntata/appretto/lievitazione → ambiente; appretto/panetti → in panetti).
 */
export function inferPhaseFlags(name: string): { ambient: boolean; balled: boolean } {
  const n = name.toLowerCase();
  return {
    ambient: /puntata|appretto|lievitaz/.test(n),
    balled: /appretto|panett|pallin|stagli/.test(n),
  };
}

export function createPhaseFromPreset(p: PhasePreset): Phase {
  return createPhase(p.name, p.hours, p.temp, { ambient: p.ambient, balled: p.balled });
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
    flourBlend: [],
    water: 650,
    salt: 28,
    fat: 0,
    yeastType: "fresh",
    yeast: 2,
    pieceWeight: 270,
    preferments: [],
    phases: [
      createPhase("Puntata", 2, 22, { ambient: true }),
      createPhase("Maturazione in frigo", 24, 4),
      createPhase("Appretto", 4, 22, { ambient: true, balled: true }),
    ],
    targetDoughTemp: 24,
    flourTemp: 20,
    prefermentTemp: 18,
    mixer: "spiral",
    flourW: null,
    start: nextQuarterHour(now),
    ambientTemp: null,
    ambientHumidity: null,
    plan: { mode: "forward", targetReady: "", adapt: "yeast" },
  };
}
