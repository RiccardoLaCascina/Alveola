import { z } from "zod";

/*
  Modello dell'impasto: lo schema Zod è l'unica fonte di verità.
  - I tipi TypeScript si ricavano dallo schema (z.infer), quindi non possono divergere.
  - Lo stesso schema valida i dati salvati sul telefono: se sono vecchi o rovinati,
    l'app riparte dai valori di esempio invece di rompersi.

  I numeri inseriti dall'utente sono `number | null`: null = campo vuoto.
  Così distinguiamo "0 g di sale" (scelta) da "non ho ancora scritto niente".
*/

export const YEAST_TYPES = ["fresh", "dry", "none"] as const;
export const PREFERMENT_TYPES = ["biga", "poolish", "lmSolid", "lmLiquid", "custom"] as const;
export const MIXER_TYPES = ["hand", "fork", "diving", "planetary", "spiral"] as const;

const value = z.number().nullable();

export const PrefermentSchema = z.object({
  id: z.string(),
  type: z.enum(PREFERMENT_TYPES),
  /** peso totale del prefermento, g */
  weight: value,
  /** idratazione del prefermento, % sulla sua farina */
  hydration: value,
  /** lievito fresco usato nel prefermento, g (ignorato per il lievito madre) */
  yeast: value,
});

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** durata, ore */
  hours: value,
  /** temperatura, °C */
  temp: value,
});

export const DoughSchema = z.object({
  /** ingredienti aggiunti in vasca, esclusi i prefermenti, g */
  flour: value,
  water: value,
  salt: value,
  fat: value,
  yeastType: z.enum(YEAST_TYPES),
  yeast: value,
  /** peso del panetto (vale anche per teglia e pala), g */
  pieceWeight: value,
  preferments: z.array(PrefermentSchema),
  phases: z.array(PhaseSchema),
  /** temperature di impastamento, °C */
  targetDoughTemp: value,
  flourTemp: value,
  prefermentTemp: value,
  mixer: z.enum(MIXER_TYPES),
  /** forza della farina (W) */
  flourW: value,
  /** inizio impasto, "YYYY-MM-DDTHH:mm" (ora locale) oppure "" */
  start: z.string(),
});

export type YeastType = (typeof YEAST_TYPES)[number];
export type PrefermentType = (typeof PREFERMENT_TYPES)[number];
export type MixerType = (typeof MIXER_TYPES)[number];
export type Preferment = z.infer<typeof PrefermentSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Dough = z.infer<typeof DoughSchema>;

/** Segnalazione mostrata al pizzaiolo: "warning" = attenzione, "info" = conferma o spiegazione. */
export type Flag = { tone: "warning" | "info"; message: string };
