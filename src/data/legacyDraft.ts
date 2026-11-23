import { DoughSchema, MIXER_TYPES, PREFERMENT_TYPES, YEAST_TYPES, type Dough, type MixerType } from "@/domain/model";
import { inferPhaseFlags, newId } from "@/domain/presets";

/** Chiave usata dalla prima versione (legacy/index.html) per la bozza dell'impasto. */
export const LEGACY_DRAFT_KEY = "banco-impasti-bozza";

const MIXER_BY_RISE: Record<string, MixerType> = { "1": "hand", "3": "fork", "3.5": "diving", "4": "planetary", "5": "spiral" };

const toNum = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;

type LegacyPf = { type?: unknown; weight?: unknown; hyd?: unknown; yeast?: unknown };
type LegacyPhase = { name?: unknown; h?: unknown; t?: unknown };

/**
 * Converte la bozza salvata dalla prima versione nel nuovo modello.
 * Restituisce null se i dati non sono riconoscibili.
 */
export function convertLegacyDraft(raw: unknown): Dough | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const candidate: Dough = {
    flour: toNum(s.flour),
    flourBlend: [],
    water: toNum(s.water),
    salt: toNum(s.salt),
    fat: toNum(s.fat),
    yeastType: oneOf(YEAST_TYPES, s.yeastType, "fresh"),
    yeast: toNum(s.yeast),
    pieceWeight: toNum(s.piece),
    preferments: (Array.isArray(s.pf) ? (s.pf as LegacyPf[]) : []).map((p) => ({
      id: newId(),
      type: oneOf(PREFERMENT_TYPES, p.type, "custom"),
      weight: toNum(p.weight),
      hydration: toNum(p.hyd),
      yeast: toNum(p.yeast),
      flourBlend: [],
    })),
    phases: (Array.isArray(s.phases) ? (s.phases as LegacyPhase[]) : []).map((p) => {
      const name = typeof p.name === "string" ? p.name : "Fase";
      return { id: newId(), name, hours: toNum(p.h), temp: toNum(p.t), ...inferPhaseFlags(name) };
    }),
    targetDoughTemp: toNum(s.tfi),
    flourTemp: toNum(s.tFlour),
    prefermentTemp: toNum(s.tPf),
    mixer: oneOf(MIXER_TYPES, MIXER_BY_RISE[String(s.mixer)], "spiral"),
    flourW: toNum(s.wFlour),
    start: typeof s.start === "string" ? s.start : "",
    ambientTemp: null,
    ambientHumidity: null,
    plan: { mode: "forward", targetReady: "", adapt: "yeast" },
  };
  const parsed = DoughSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Legge la bozza della prima versione dal telefono, se c'è. */
export function readLegacyDraft(): Dough | null {
  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    return raw ? convertLegacyDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
