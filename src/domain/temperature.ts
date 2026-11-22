/** Calore specifico della farina rispetto a quello dell'acqua (= 1). */
export const FLOUR_SPECIFIC_HEAT = 0.4;

export type WaterTempInput = {
  /** temperatura voluta a fine impasto, °C */
  targetDoughTemp: number;
  flourTemp: number;
  /** riscaldamento dato dall'impastatrice, °C */
  mixerRise: number;
  /** farina e acqua aggiunte in vasca, g */
  flour: number;
  water: number;
  /** farina e acqua contenute nei prefermenti, con la loro temperatura (se c'è) */
  preferment?: { flour: number; water: number; temp: number } | null;
};

/**
 * Temperatura dell'acqua per arrivare alla temperatura finale voluta.
 * Bilancio termico: il calore portato da farina, acqua e prefermenti deve dare
 * (temperatura finale − riscaldamento dell'impastatrice).
 * Restituisce null se manca l'acqua (non si può risolvere).
 */
export function waterTemperature(i: WaterTempInput): number | null {
  if (i.water <= 0) return null;
  const flourCap = i.flour * FLOUR_SPECIFIC_HEAT;
  const pf = i.preferment;
  const pfCap = pf ? pf.flour * FLOUR_SPECIFIC_HEAT + pf.water : 0;
  const totalCap = flourCap + i.water + pfCap;
  const target = i.targetDoughTemp - i.mixerRise;
  return (target * totalCap - flourCap * i.flourTemp - (pf ? pfCap * pf.temp : 0)) / i.water;
}
