import type { BlendPart, Dough, Flag, Flour } from "./model";
import type { Composition } from "./impasto";
import { grams } from "./impasto";
import { flourDisplayName } from "./presets";
import { fmt, percent } from "./format";

/*
  Miscele di farine.
  - L'impasto in vasca ha la sua miscela; ogni prefermento può averne una propria
    (vuota = usa la stessa dell'impasto).
  - Le quote sono in %. Se non sommano a 100 vengono riproporzionate, e lo segnaliamo.
  - Il profilo della miscela (W, P/L, proteine, assorbimento) è la media pesata sui grammi
    effettivi di ogni farina nell'impasto totale. Per W e P/L è un'approssimazione
    (i valori dell'alveografo non si sommano in modo perfettamente lineare), ma è quella usata in pratica.
*/

/** Tolleranza sulla somma delle quote: 99,5–100,5 % è considerato "100 %". */
export const BLEND_SUM_TOLERANCE = 0.5;

export function blendSum(parts: BlendPart[]): number {
  return parts.reduce((s, p) => s + grams(p.percent), 0);
}

/** Quote con percentuale positiva, riportate a frazioni che sommano a 1. Vuoto se non c'è niente di valido. */
export function normalizeBlend(parts: BlendPart[]): { flourId: string; share: number }[] {
  const valid = parts.filter((p) => grams(p.percent) > 0);
  const sum = blendSum(valid);
  if (sum <= 0) return [];
  // Se la stessa farina compare due volte, le quote si sommano.
  const byFlour = new Map<string, number>();
  for (const p of valid) byFlour.set(p.flourId, (byFlour.get(p.flourId) ?? 0) + grams(p.percent) / sum);
  return [...byFlour].map(([flourId, share]) => ({ flourId, share }));
}

export type FlourUsage = {
  flourId: string;
  /** farina dell'archivio; undefined se è stata eliminata */
  flour: Flour | undefined;
  /** grammi in vasca */
  mainGrams: number;
  /** grammi nei prefermenti */
  prefermentGrams: number;
  grams: number;
  /** % sulla farina totale dell'impasto */
  percent: number;
};

export type FlourDistribution = {
  usages: FlourUsage[];
  /** grammi di farina senza una miscela assegnata */
  unassignedGrams: number;
};

/** Quanti grammi di ogni farina finiscono nell'impasto, tra vasca e prefermenti. */
export function flourDistribution(d: Dough, c: Composition, flours: Flour[]): FlourDistribution {
  const byId = new Map(flours.map((f) => [f.id, f]));
  const acc = new Map<string, { main: number; pf: number }>();
  let unassignedGrams = 0;

  const add = (gramsOfFlour: number, blend: BlendPart[], where: "main" | "pf") => {
    if (gramsOfFlour <= 0) return;
    const parts = normalizeBlend(blend);
    if (!parts.length) {
      unassignedGrams += gramsOfFlour;
      return;
    }
    for (const p of parts) {
      const cur = acc.get(p.flourId) ?? { main: 0, pf: 0 };
      cur[where] += gramsOfFlour * p.share;
      acc.set(p.flourId, cur);
    }
  };

  add(c.flour, d.flourBlend, "main");
  for (const pf of d.preferments) {
    const b = c.preferments.find((x) => x.id === pf.id);
    if (b) add(b.flour, prefermentBlend(pf.flourBlend, d.flourBlend), "pf");
  }

  const usages: FlourUsage[] = [...acc].map(([flourId, g]) => ({
    flourId,
    flour: byId.get(flourId),
    mainGrams: g.main,
    prefermentGrams: g.pf,
    grams: g.main + g.pf,
    percent: percent(g.main + g.pf, c.totalFlour),
  }));
  usages.sort((a, b) => b.grams - a.grams);
  return { usages, unassignedGrams };
}

export type ProfileValue = {
  value: number;
  /** quota della farina (0–1) che ha questo dato: < 1 vuol dire che il valore è parziale */
  coverage: number;
};

export type BlendProfile = {
  w: ProfileValue | null;
  pl: ProfileValue | null;
  protein: ProfileValue | null;
  absorption: ProfileValue | null;
};

/** Umidità tipica di una farina di grano tenero, % (per legge al massimo 15,5 %). */
export const TYPICAL_MOISTURE = 14.5;

/**
 * Proteine "tal quale" (sulla farina così com'è, con la sua umidità).
 * Se la scheda le dà "su sostanza secca" le convertiamo: tq = ss × (1 − umidità).
 * Così farine scritte nei due modi si possono confrontare e mescolare.
 */
export function proteinAsIs(f: Pick<Flour, "protein" | "proteinBasis">): number | null {
  if (f.protein == null) return null;
  return f.proteinBasis === "ss" ? f.protein * (1 - TYPICAL_MOISTURE / 100) : f.protein;
}

const FIELD_READERS = {
  w: (f: Flour) => f.w,
  pl: (f: Flour) => f.pl,
  protein: (f: Flour) => proteinAsIs(f),
  absorption: (f: Flour) => f.absorption,
} as const;
type NumericFlourField = keyof typeof FIELD_READERS;

/**
 * Media pesata sui grammi di un dato della scheda tecnica, tra le farine che ce l'hanno.
 * Un valore 0 o negativo vale come "dato mancante" (nessuna farina ha W 0 o assorbimento 0).
 */
function weighted(usages: FlourUsage[], field: NumericFlourField, totalGrams: number): ProfileValue | null {
  let sum = 0;
  let weight = 0;
  for (const u of usages) {
    const v = u.flour ? FIELD_READERS[field](u.flour) : null;
    if (v == null || !Number.isFinite(v) || v <= 0 || u.grams <= 0) continue;
    sum += v * u.grams;
    weight += u.grams;
  }
  if (weight <= 0) return null;
  return { value: sum / weight, coverage: totalGrams > 0 ? weight / totalGrams : 0 };
}

export function blendProfile(dist: FlourDistribution): BlendProfile {
  const total = dist.usages.reduce((s, u) => s + u.grams, 0) + dist.unassignedGrams;
  return {
    w: weighted(dist.usages, "w", total),
    pl: weighted(dist.usages, "pl", total),
    protein: weighted(dist.usages, "protein", total),
    absorption: weighted(dist.usages, "absorption", total),
  };
}

/** P/L: sotto 0,4 molto estensibile, oltre 0,7 tenace. Indicativo per la pizza. */
export function plNote(pl: number): string {
  if (pl < 0.4) return "molto estensibile, poco tenace";
  if (pl <= 0.7) return "equilibrata";
  return "tenace, poco estensibile";
}

/** Miscela da usare per un prefermento: la sua se ha quote valide, altrimenti quella dell'impasto. */
export function prefermentBlend(own: BlendPart[], main: BlendPart[]): BlendPart[] {
  return normalizeBlend(own).length ? own : main;
}

export type WSource = "blend" | "mixed" | "partial" | "manual" | "loading";

export type EffectiveW = {
  /** W usata per i controlli; null se non si sa */
  value: number | null;
  /**
   * - blend: tutta la farina ha la W in archivio
   * - mixed: W della miscela per la parte nota + W scritta a mano per il resto
   * - partial: solo una parte della farina ha la W e non c'è una W scritta a mano
   * - manual: nessuna W dalla miscela, vale quella scritta a mano
   * - loading: l'archivio farine si sta ancora caricando
   */
  source: WSource | null;
  /** quota della farina coperta dalla W della miscela (0–1) */
  coverage: number;
};

/** Quale W usare: quella della miscela solo se copre tutta la farina; altrimenti integra con la W scritta a mano. */
export function resolveEffectiveW(profileW: ProfileValue | null, manualW: number | null, opts: { loading?: boolean } = {}): EffectiveW {
  const manual = manualW != null && manualW > 0 ? manualW : 0;
  if (opts.loading) return { value: null, source: "loading", coverage: 0 };
  if (profileW && profileW.coverage >= 0.999) return { value: profileW.value, source: "blend", coverage: 1 };
  if (profileW && manual)
    return { value: profileW.value * profileW.coverage + manual * (1 - profileW.coverage), source: "mixed", coverage: profileW.coverage };
  if (profileW) return { value: profileW.value, source: "partial", coverage: profileW.coverage };
  if (manual) return { value: manual, source: "manual", coverage: 0 };
  return { value: null, source: null, coverage: 0 };
}

/** Avvisi sulla miscela: quote che non sommano a 100, farine mancanti, dati parziali, acqua rispetto all'assorbimento. */
export function blendFlags(d: Dough, dist: FlourDistribution, profile: BlendProfile, hydration: number): Flag[] {
  const flags: Flag[] = [];

  const checkSum = (parts: BlendPart[], what: string, fallback: string) => {
    if (!parts.length) return;
    if (!normalizeBlend(parts).length) {
      flags.push({ tone: "warning", message: `La miscela ${what} non ha quote valide: inserisci le percentuali${fallback}.` });
      return;
    }
    const s = blendSum(parts);
    if (Math.abs(s - 100) > BLEND_SUM_TOLERANCE)
      flags.push({ tone: "warning", message: `La miscela ${what} somma a ${fmt(s, 1)} %: le quote vengono riproporzionate a 100 %.` });
  };
  checkSum(d.flourBlend, "dell’impasto", "");
  d.preferments.forEach((p, i) => checkSum(p.flourBlend, `del prefermento ${i + 1}`, " (per ora usa quella dell’impasto)"));

  const missing = dist.usages.filter((u) => !u.flour);
  if (missing.length)
    flags.push({ tone: "warning", message: "Una farina della miscela non è più nell’archivio: rimuovila o scegline un’altra." });

  if (dist.usages.length && dist.unassignedGrams > 0)
    flags.push({ tone: "warning", message: `${fmt(dist.unassignedGrams)} g di farina non hanno una miscela assegnata.` });

  for (const [key, label] of [["w", "W"], ["absorption", "assorbimento"]] as const) {
    const v = profile[key];
    if (v && v.coverage < 0.999)
      flags.push({ tone: "info", message: `Il valore di ${label} vale solo per il ${fmt(v.coverage * 100, 0)} % della farina: alcune farine non hanno il dato.` });
  }

  const abs = profile.absorption?.value;
  if (abs && hydration > 0) {
    if (hydration > abs + 5)
      flags.push({ tone: "warning", message: `Idratazione ${fmt(hydration, 1)} % oltre l’assorbimento della miscela (${fmt(abs, 0)} %): impasto più appiccicoso, servono pieghe e una farina che regga.` });
    else if (hydration < abs - 8)
      flags.push({ tone: "info", message: `Idratazione ${fmt(hydration, 1)} % ben sotto l’assorbimento della miscela (${fmt(abs, 0)} %): puoi aggiungere acqua.` });
    else flags.push({ tone: "info", message: `Idratazione in linea con l’assorbimento della miscela (${fmt(abs, 0)} %).` });
  }

  return flags;
}

/** Riga leggibile per elenchi e per l'AI: "Nome · Molino — 350 g (35 %)". */
export function usageLabel(u: FlourUsage): string {
  return `${u.flour ? flourDisplayName(u.flour) : "Farina eliminata"} — ${fmt(u.grams)} g (${fmt(u.percent, 0)} %)`;
}
