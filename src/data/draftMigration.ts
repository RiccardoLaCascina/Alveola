import { inferPhaseFlags } from "@/domain/presets";

/** Versione attuale della bozza salvata. v2: le fasi hanno "ambient" e "balled". */
export const DRAFT_VERSION = 2;

/**
 * Aggiorna una bozza salvata da una versione precedente.
 * v1 → v2: deduce "a temperatura ambiente" e "in panetti" dal nome delle fasi, senza toccare valori già presenti.
 * Lo schema Zod poi completa e valida il resto.
 */
export function migrateDraft(persisted: unknown, fromVersion: number): unknown {
  const state = persisted as { dough?: { phases?: Array<Record<string, unknown>> } } | undefined;
  if (fromVersion < 2 && state?.dough && Array.isArray(state.dough.phases)) {
    state.dough.phases = state.dough.phases.map((p) => {
      const guess = inferPhaseFlags(typeof p.name === "string" ? p.name : "");
      return { ...p, ambient: p.ambient ?? guess.ambient, balled: p.balled ?? guess.balled };
    });
  }
  return state;
}
