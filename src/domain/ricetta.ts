import type { Dough, Recipe } from "./model";
import { computeComposition, grams } from "./impasto";
import { percent } from "./format";

/*
  Ricetta in percentuale → grammi da pesare.

  Il pizzaiolo dice: "voglio 6 panetti da 280 g, al 65 % d'acqua, 2,8 % di sale".
  Tutte le percentuali sono sulla FARINA TOTALE (= 100 %), prefermenti compresi.

  Peso totale = farina totale × (1 + idratazione + sale + olio) + lievito (in vasca e nei prefermenti)
  quindi:      farina totale = (peso totale − lievito) / (1 + idratazione + sale + olio)

  Poi in vasca va solo quello che manca: farina e acqua dei prefermenti sono già "dentro".
*/

export type RecipeGrams = {
  /** grammi da mettere in vasca */
  flour: number;
  water: number;
  salt: number;
  fat: number;
  /** farina e acqua totali (vasca + prefermenti) */
  totalFlour: number;
  totalWater: number;
  /** peso dell'impasto voluto: panetti × peso del panetto */
  targetWeight: number;
  /** true se i prefermenti contengono già più farina o acqua di quella che serve */
  prefermentTooBig: boolean;
};

const round = (v: number, decimals: number) => Math.round(v * 10 ** decimals) / 10 ** decimals;

/** Grammi in vasca per la ricetta in percentuale. null se mancano panetti, peso del panetto o idratazione. */
export function gramsFromRecipe(d: Dough): RecipeGrams | null {
  const r = d.recipe;
  const targetWeight = grams(r.pieces) * grams(d.pieceWeight);
  if (targetWeight <= 0 || r.hydration == null || r.hydration <= 0) return null;

  const h = r.hydration / 100;
  const s = grams(r.salt) / 100;
  const o = grams(r.fat) / 100;
  const c = computeComposition(d);
  // il lievito non è in percentuale: lo pesi tu (o usi quello consigliato), qui lo togliamo dal peso
  const yeast = c.yeastRaw + c.prefermentYeast;

  const totalFlour = Math.max(0, (targetWeight - yeast) / (1 + h + s + o));
  const totalWater = totalFlour * h;
  const flour = totalFlour - c.prefermentFlour;
  const water = totalWater - c.prefermentWater;

  return {
    flour: Math.max(0, round(flour, 0)),
    water: Math.max(0, round(water, 0)),
    salt: round(totalFlour * s, 1),
    fat: round(totalFlour * o, 1),
    totalFlour,
    totalWater,
    targetWeight,
    prefermentTooBig: flour < 0 || water < 0,
  };
}

/** Se la ricetta è in percentuale, riscrive i grammi in vasca; altrimenti lascia l'impasto com'è. */
export function applyRecipe(d: Dough): Dough {
  if (d.recipe.mode !== "percent") return d;
  const g = gramsFromRecipe(d);
  if (!g) return d;
  return { ...d, flour: g.flour, water: g.water, salt: g.salt, fat: g.fat };
}

/**
 * Percentuali che corrispondono ai grammi scritti a mano: servono quando si passa
 * da "grammi" a "percentuale", così l'impasto non cambia sotto gli occhi.
 */
export function recipeFromGrams(d: Dough): Omit<Recipe, "mode"> {
  const c = computeComposition(d);
  const piece = grams(d.pieceWeight);
  const round1 = (v: number) => round(v, 1);
  return {
    pieces: piece > 0 && c.totalWeight > 0 ? Math.max(1, Math.round(c.totalWeight / piece)) : d.recipe.pieces,
    hydration: c.totalFlour > 0 ? round1(c.hydration) : d.recipe.hydration,
    salt: c.totalFlour > 0 ? round1(percent(c.salt, c.totalFlour)) : d.recipe.salt,
    fat: c.totalFlour > 0 ? round1(percent(c.fat, c.totalFlour)) : d.recipe.fat,
  };
}

/**
 * Idratazione consigliata dalla scheda tecnica: l'assorbimento al farinografo è l'acqua
 * che la farina "tiene" senza diventare appiccicosa. È un punto di partenza, non un limite.
 */
export function suggestedHydration(absorption: number | null | undefined): { value: number; note: string } | null {
  if (absorption == null || !Number.isFinite(absorption) || absorption <= 0) return null;
  const value = Math.round(absorption);
  return {
    value,
    note: `Fino al ${value + 5} % resta gestibile con qualche piega; oltre serve più tecnica.`,
  };
}
