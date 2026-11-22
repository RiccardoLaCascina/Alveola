import type { TempBand } from "@/domain/lievito";

/** Classi Tailwind per le tre fasce di temperatura (colori definiti nel tema). */
export const BAND_BG: Record<TempBand, string> = { cold: "bg-cold", mild: "bg-mild", warm: "bg-warm" };
export const BAND_BORDER: Record<TempBand, string> = { cold: "border-l-cold", mild: "border-l-mild", warm: "border-l-warm" };
export const BAND_LABEL: Record<TempBand, string> = { cold: "Sotto 10 °C", mild: "10–20 °C", warm: "Da 20 °C" };
