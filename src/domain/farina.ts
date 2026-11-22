import type { Flag } from "./model";
import { fmt } from "./format";

export type WRange = { min: number; max: number; label: string; raisedForHydration: boolean };

/** Sopra questa idratazione la W consigliata sale di 20 punti. */
export const HIGH_HYDRATION = 75;

/** Forza (W) consigliata in base alla durata totale della maturazione. */
export function recommendedW(totalHours: number, hydration: number): WRange | null {
  if (totalHours <= 0) return null;
  const [min, max, label] =
    totalHours <= 6 ? [170, 220, "farina debole"]
    : totalHours <= 12 ? [220, 270, "farina media"]
    : totalHours <= 24 ? [260, 310, "farina medio-forte"]
    : totalHours <= 48 ? [300, 350, "farina forte"]
    : totalHours <= 72 ? [340, 380, "farina molto forte"]
    : [370, 420, "farina di forza o manitoba"];
  const extra = hydration > HIGH_HYDRATION ? 20 : 0;
  return { min: min + extra, max: max + extra, label, raisedForHydration: extra > 0 };
}

/** Confronto tra la W della farina usata e quella consigliata. */
export function flourStrengthFlag(flourW: number, range: WRange, totalHours: number): Flag {
  if (flourW < range.min)
    return {
      tone: "warning",
      message: `La tua farina (W ${fmt(flourW)}) è debole per ${fmt(totalHours, 0)} h di maturazione: accorcia i tempi o taglia con una farina più forte.`,
    };
  if (flourW > range.max + 40)
    return { tone: "info", message: `La tua farina (W ${fmt(flourW)}) è più forte del necessario: puoi allungare la maturazione.` };
  return { tone: "info", message: `La tua farina (W ${fmt(flourW)}) è adatta a questi tempi.` };
}
