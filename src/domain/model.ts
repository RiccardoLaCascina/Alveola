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

export const FLOUR_TYPES = ["00", "0", "1", "2", "integrale", "semola", "manitoba", "altro"] as const;
export const PROTEIN_BASES = ["tq", "ss"] as const;

const value = z.number().nullable();

/** Una farina dell'archivio, con i dati della scheda tecnica. */
export const FlourSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** molino / marca */
  mill: z.string(),
  type: z.enum(FLOUR_TYPES),
  /** forza (alveografo) */
  w: value,
  /** rapporto tenacità / estensibilità (alveografo) */
  pl: value,
  /** proteine, % */
  protein: value,
  /** come sono indicate le proteine sulla scheda: "tq" = tal quale, "ss" = su sostanza secca */
  proteinBasis: z.enum(PROTEIN_BASES).default("tq"),
  /** assorbimento d'acqua (farinografo), % */
  absorption: value,
  notes: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/** Quota di una farina in una miscela, in % (le quote di una miscela dovrebbero sommare a 100). */
export const BlendPartSchema = z.object({
  flourId: z.string(),
  percent: value,
});

export const PrefermentSchema = z.object({
  id: z.string(),
  type: z.enum(PREFERMENT_TYPES),
  /** peso totale del prefermento, g */
  weight: value,
  /** idratazione del prefermento, % sulla sua farina */
  hydration: value,
  /** lievito fresco usato nel prefermento, g (ignorato per il lievito madre) */
  yeast: value,
  /** miscela di farine del prefermento; vuota = stessa miscela dell'impasto */
  flourBlend: z.array(BlendPartSchema).default([]),
});

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** durata, ore */
  hours: value,
  /** temperatura prevista, °C */
  temp: value,
  /** fase a temperatura ambiente (puntata, appretto): oggi usa la temperatura del laboratorio */
  ambient: z.boolean().default(false),
  /** durante questa fase l'impasto è già in panetti (lo staglio avviene prima della prima fase in panetti) */
  balled: z.boolean().default(false),
});

export const ADAPT_MODES = ["yeast", "times"] as const;
export const PLAN_MODES = ["forward", "backward"] as const;

export const PlanSchema = z.object({
  /** forward = parto da un'ora di inizio; backward = voglio essere pronto a un'ora */
  mode: z.enum(PLAN_MODES).default("forward"),
  /** "pronto da cuocere" voluto, "YYYY-MM-DDTHH:mm" oppure "" */
  targetReady: z.string().default(""),
  /**
   * Se oggi l'ambiente è diverso dalla temperatura prevista delle fasi ambiente:
   * - yeast: i tempi restano, cambia la dose di lievito consigliata
   * - times: il lievito resta, si adattano le durate delle fasi ambiente
   */
  adapt: z.enum(ADAPT_MODES).default("yeast"),
});

export const DoughSchema = z.object({
  /** ingredienti aggiunti in vasca, esclusi i prefermenti, g */
  flour: value,
  /** miscela delle farine aggiunte in vasca (in % sulla farina in vasca) */
  flourBlend: z.array(BlendPartSchema).default([]),
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
  /** forza della farina (W) scritta a mano: usata solo se la miscela non ha farine con W */
  flourW: value,
  /** inizio impasto, "YYYY-MM-DDTHH:mm" (ora locale) oppure "" */
  start: z.string(),
  /** temperatura del laboratorio oggi, °C (usata dalle fasi ambiente) */
  ambientTemp: value.default(null),
  /** umidità relativa del laboratorio oggi, % (consigli sulla superficie dei panetti e sull'acqua) */
  ambientHumidity: value.default(null),
  plan: PlanSchema.default({ mode: "forward", targetReady: "", adapt: "yeast" }),
});

export type YeastType = (typeof YEAST_TYPES)[number];
export type PrefermentType = (typeof PREFERMENT_TYPES)[number];
export type MixerType = (typeof MIXER_TYPES)[number];
export type FlourType = (typeof FLOUR_TYPES)[number];
export type ProteinBasis = (typeof PROTEIN_BASES)[number];
export type Flour = z.infer<typeof FlourSchema>;
export type BlendPart = z.infer<typeof BlendPartSchema>;
export type Preferment = z.infer<typeof PrefermentSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Dough = z.infer<typeof DoughSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type AdaptMode = (typeof ADAPT_MODES)[number];
export type PlanMode = (typeof PLAN_MODES)[number];

/** Segnalazione mostrata al pizzaiolo: "warning" = attenzione, "info" = conferma o spiegazione. */
export type Flag = { tone: "warning" | "info"; message: string };
