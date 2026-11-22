import type { Dough, Flag } from "./model";
import { isSourdough } from "./presets";
import { fmt, percent } from "./format";

/** 1 g di lievito secco vale circa 3 g di lievito fresco. */
export const DRY_TO_FRESH = 3;

/** Grammi inseriti: campo vuoto o negativo = 0. */
export const grams = (v: number | null | undefined): number => (v != null && Number.isFinite(v) && v > 0 ? v : 0);

/** Divide un prefermento nella farina e nell'acqua che contiene. */
export function splitPreferment(weight: number, hydration: number): { flour: number; water: number } {
  const flour = weight / (1 + hydration / 100);
  return { flour, water: weight - flour };
}

export type PrefermentBreakdown = {
  id: string;
  flour: number;
  water: number;
  /** lievito fresco nel prefermento, g (0 per il lievito madre) */
  yeast: number;
  /** % di lievito sulla farina del prefermento */
  yeastPercent: number;
  sourdough: boolean;
};

export type Composition = {
  flour: number;
  water: number;
  salt: number;
  fat: number;
  /** lievito messo in vasca così come pesato (fresco o secco) */
  yeastRaw: number;
  /** lievito in vasca convertito in fresco */
  mainFreshYeast: number;
  preferments: PrefermentBreakdown[];
  prefermentFlour: number;
  prefermentWater: number;
  prefermentWeight: number;
  prefermentYeast: number;
  sourdoughWeight: number;
  totalFlour: number;
  totalWater: number;
  /** tutto il lievito di birra, in equivalente fresco */
  freshYeastEquivalent: number;
  totalWeight: number;
  /** idratazione totale, % (acqua totale / farina totale) */
  hydration: number;
};

export function computeComposition(d: Dough): Composition {
  const flour = grams(d.flour);
  const water = grams(d.water);
  const salt = grams(d.salt);
  const fat = grams(d.fat);
  const yeastRaw = d.yeastType === "none" ? 0 : grams(d.yeast);
  const mainFreshYeast = d.yeastType === "dry" ? yeastRaw * DRY_TO_FRESH : yeastRaw;

  const preferments = d.preferments.map((p): PrefermentBreakdown & { weight: number } => {
    const weight = grams(p.weight);
    const sourdough = isSourdough(p.type);
    const split = splitPreferment(weight, grams(p.hydration));
    const yeast = sourdough ? 0 : grams(p.yeast);
    return { id: p.id, weight, ...split, yeast, yeastPercent: percent(yeast, split.flour), sourdough };
  });

  const sum = (pick: (p: (typeof preferments)[number]) => number) => preferments.reduce((s, p) => s + pick(p), 0);
  const prefermentFlour = sum((p) => p.flour);
  const prefermentWater = sum((p) => p.water);
  const prefermentWeight = sum((p) => p.weight);
  const prefermentYeast = sum((p) => p.yeast);
  const sourdoughWeight = sum((p) => (p.sourdough ? p.weight : 0));

  const totalFlour = flour + prefermentFlour;
  const totalWater = water + prefermentWater;

  return {
    flour,
    water,
    salt,
    fat,
    yeastRaw,
    mainFreshYeast,
    preferments: preferments.map(({ weight: _weight, ...rest }) => rest),
    prefermentFlour,
    prefermentWater,
    prefermentWeight,
    prefermentYeast,
    sourdoughWeight,
    totalFlour,
    totalWater,
    freshYeastEquivalent: mainFreshYeast + prefermentYeast,
    // Il lievito dei prefermenti è contato a parte, come nella prima versione.
    totalWeight: flour + water + salt + fat + yeastRaw + prefermentWeight + prefermentYeast,
    hydration: percent(totalWater, totalFlour),
  };
}

export function hydrationNote(hydration: number): string {
  if (hydration <= 0) return "Inserisci farina e acqua per iniziare.";
  if (hydration < 55) return "Impasto rigido, tipico di pani da forma e grissini.";
  if (hydration < 62) return "Idratazione medio-bassa, impasto facile da gestire.";
  if (hydration < 70) return "Idratazione media, adatta a molte pizze e pani.";
  if (hydration < 78) return "Idratazione alta: serve una farina forte e pieghe.";
  return "Idratazione molto alta: farina forte e buona tecnica.";
}

export type BakersRow = { label: string; grams: number; percent: number };

/** Percentuali del panettiere: ogni ingrediente rispetto alla farina totale (= 100 %). */
export function bakersTable(c: Composition): BakersRow[] {
  const rows: BakersRow[] = [
    { label: "Farina totale", grams: c.totalFlour, percent: 100 },
    { label: "Acqua totale", grams: c.totalWater, percent: c.hydration },
    { label: "Sale", grams: c.salt, percent: percent(c.salt, c.totalFlour) },
    { label: "Lievito (equiv. fresco)", grams: c.freshYeastEquivalent, percent: percent(c.freshYeastEquivalent, c.totalFlour) },
  ];
  if (c.fat) rows.push({ label: "Olio / grassi", grams: c.fat, percent: percent(c.fat, c.totalFlour) });
  if (c.preferments.length)
    rows.push({ label: "Farina prefermentata", grams: c.prefermentFlour, percent: percent(c.prefermentFlour, c.totalFlour) });
  if (c.sourdoughWeight)
    rows.push({ label: "Lievito madre", grams: c.sourdoughWeight, percent: percent(c.sourdoughWeight, c.totalFlour) });
  return rows;
}

/** Quanti panetti escono e quanto avanza. null se manca il peso dell'impasto o del panetto. */
export function portion(totalWeight: number, pieceWeight: number | null): { pieces: number; remainder: number } | null {
  const piece = grams(pieceWeight);
  if (piece <= 0 || totalWeight <= 0) return null;
  const pieces = Math.floor(totalWeight / piece);
  return { pieces, remainder: totalWeight - pieces * piece };
}

export function compositionFlags(c: Composition, yeastType: Dough["yeastType"]): Flag[] {
  const flags: Flag[] = [];
  if (c.totalFlour <= 0) return flags;
  const saltPct = percent(c.salt, c.totalFlour);
  if (c.salt === 0) flags.push({ tone: "warning", message: "Nessun sale inserito." });
  else if (saltPct < 1.8) flags.push({ tone: "warning", message: `Sale al ${fmt(saltPct, 1)} %: sotto la media (2–3 %).` });
  else if (saltPct > 3.2)
    flags.push({ tone: "warning", message: `Sale al ${fmt(saltPct, 1)} %: sopra la media, può frenare la lievitazione.` });
  if (c.freshYeastEquivalent === 0 && c.sourdoughWeight === 0)
    flags.push({ tone: "warning", message: "Nessun agente lievitante: aggiungi lievito o lievito madre." });
  if (yeastType === "dry" && c.yeastRaw)
    flags.push({
      tone: "info",
      message: `${fmt(c.yeastRaw, 1)} g di secco corrispondono a circa ${fmt(c.yeastRaw * DRY_TO_FRESH, 1)} g di fresco.`,
    });
  if (c.prefermentFlour > 0)
    flags.push({ tone: "info", message: `Il ${fmt(percent(c.prefermentFlour, c.totalFlour), 0)} % della farina è prefermentata.` });
  return flags;
}
