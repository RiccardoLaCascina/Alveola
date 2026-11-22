import type { Dough, Flag, Flour } from "./model";
import { blendFlags, blendProfile, flourDistribution, resolveEffectiveW } from "./miscela";
import { MIXERS } from "./presets";
import { fmt, percent } from "./format";
import { DRY_TO_FRESH, bakersTable, compositionFlags, computeComposition, grams, hydrationNote, portion } from "./impasto";
import { MIN_RELIABLE_EQUIVALENT_HOURS, maturationSummary, suggestedFreshYeastPercent } from "./lievito";
import { waterTemperature } from "./temperature";
import { flourStrengthFlag, recommendedW } from "./farina";
import { buildSchedule } from "./programma";

/**
 * Analisi completa di un impasto: mette insieme tutti i calcoli del dominio.
 * È una funzione pura: stesso impasto (e stesso archivio farine) → stesso risultato.
 * `flours` è l'archivio delle farine, per risolvere le miscele.
 */
export function analyzeDough(d: Dough, flours: Flour[] = [], { floursLoaded = true }: { floursLoaded?: boolean } = {}) {
  const composition = computeComposition(d);
  const maturation = maturationSummary(d.phases);
  const c = composition;

  // --- lievito consigliato
  let yeast: { percent: number; freshGrams: number; dryGrams: number; currentPercent: number; ratio: number | null } | null = null;
  const maturationFlags: Flag[] = [];
  if (maturation.equivalentHours > 0 && c.totalFlour > 0) {
    const pct = suggestedFreshYeastPercent(maturation.equivalentHours);
    const freshGrams = (pct / 100) * c.totalFlour;
    const ratio = c.mainFreshYeast > 0 && !c.sourdoughWeight ? c.mainFreshYeast / freshGrams : null;
    yeast = { percent: pct, freshGrams, dryGrams: freshGrams / DRY_TO_FRESH, currentPercent: percent(c.mainFreshYeast, c.totalFlour), ratio };

    if (c.sourdoughWeight > 0)
      maturationFlags.push({
        tone: "warning",
        message: "Con il lievito madre la dose di lievito di birra non è necessaria: il calcolo vale solo se lo usi in aggiunta.",
      });
    else if (c.prefermentFlour > 0)
      maturationFlags.push({ tone: "info", message: "I prefermenti accelerano la maturazione: in chiusura puoi ridurre il lievito rispetto alla stima." });
    if (ratio !== null) {
      if (ratio > 1.5)
        maturationFlags.push({ tone: "warning", message: `Hai circa ${fmt(ratio, 1)} volte il lievito stimato: rischio di sovralievitazione.` });
      else if (ratio < 0.6)
        maturationFlags.push({ tone: "warning", message: `Hai circa il ${fmt(ratio * 100, 0)} % del lievito stimato: l’impasto potrebbe restare indietro.` });
    }
    if (maturation.equivalentHours < MIN_RELIABLE_EQUIVALENT_HOURS)
      maturationFlags.push({ tone: "warning", message: "Tempo molto breve: la stima è poco affidabile sotto 1,5 h equivalenti." });
  }

  // --- temperatura dell'acqua
  let waterTemp: number | null = null;
  if (d.targetDoughTemp !== null && d.flourTemp !== null) {
    waterTemp = waterTemperature({
      targetDoughTemp: d.targetDoughTemp,
      flourTemp: d.flourTemp,
      mixerRise: MIXERS[d.mixer].heatRise,
      flour: c.flour,
      water: c.water,
      preferment:
        c.preferments.length && d.prefermentTemp !== null
          ? { flour: c.prefermentFlour, water: c.prefermentWater, temp: d.prefermentTemp }
          : null,
    });
    if (waterTemp !== null && waterTemp < 2)
      maturationFlags.push({ tone: "warning", message: "Acqua sotto i 2 °C: usa acqua gelata o parte in ghiaccio, oppure raffredda la farina." });
    if (waterTemp !== null && waterTemp > 38)
      maturationFlags.push({
        tone: "warning",
        message: "Acqua oltre i 38 °C: rischi di danneggiare il lievito. Alza la temperatura della farina o abbassa quella finale.",
      });
  }

  // --- farine: distribuzione della miscela e profilo
  // Finché l'archivio non è caricato non sappiamo niente delle farine: niente avvisi né W della miscela.
  const usesArchive = d.flourBlend.length > 0 || d.preferments.some((p) => p.flourBlend.length > 0);
  const loading = !floursLoaded && usesArchive;
  const distribution = flourDistribution(d, c, flours);
  const profile = blendProfile(distribution);
  const flourFlags = loading ? [] : blendFlags(d, distribution, profile, c.hydration);

  // --- forza della farina: W della miscela se copre tutta la farina, altrimenti integrata con quella scritta a mano
  const w = recommendedW(maturation.totalHours, c.hydration);
  const effectiveW = resolveEffectiveW(profile.w, grams(d.flourW), { loading });
  if (w && effectiveW.value) maturationFlags.push(flourStrengthFlag(Math.round(effectiveW.value), w, maturation.totalHours));

  return {
    composition,
    hydrationNote: hydrationNote(c.totalFlour > 0 ? c.hydration : 0),
    bakers: bakersTable(c),
    compositionFlags: compositionFlags(c, d.yeastType),
    portion: portion(c.totalWeight, d.pieceWeight),
    maturation,
    yeast,
    waterTemp,
    recommendedW: w,
    flours: { distribution, profile, flags: flourFlags, effectiveW, loading },
    maturationFlags,
    schedule: buildSchedule(d.start, maturation.phases),
  };
}

export type DoughAnalysis = ReturnType<typeof analyzeDough>;

/** Dose da scrivere nel campo lievito quando il pizzaiolo accetta il consiglio (arrotondata a 0,1 g). */
export function yeastToApply(suggestedFreshGrams: number, yeastType: Dough["yeastType"]): number {
  const v = yeastType === "dry" ? suggestedFreshGrams / DRY_TO_FRESH : suggestedFreshGrams;
  return Math.round(v * 10) / 10;
}
