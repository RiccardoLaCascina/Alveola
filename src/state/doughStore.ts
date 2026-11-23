import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DoughSchema, type Dough, type Phase, type Plan, type Preferment, type PrefermentType } from "@/domain/model";
import {
  PHASE_PRESETS,
  PREFERMENT_PRESETS,
  createDefaultDough,
  createPhaseFromPreset,
  createPreferment,
  nextQuarterHour,
} from "@/domain/presets";
import { DRAFT_VERSION, migrateDraft } from "@/data/draftMigration";
import { analyzeDough } from "@/domain/analisi";
import { readLegacyDraft } from "@/data/legacyDraft";
import { useFlourArchive } from "./flours";

/*
  Stato dell'impasto in lavorazione (la "bozza" di oggi), condiviso da tutte le schede.
  - Zustand: uno store piccolo e veloce; ogni componente si iscrive solo ai dati che usa.
  - persist: la bozza resta salvata sul telefono (localStorage) tra un'apertura e l'altra.
  - Al caricamento i dati salvati passano da DoughSchema: se non sono validi si riparte dall'esempio.
*/

export const DRAFT_STORAGE_KEY = "lievora-impasto-bozza";
/** Chiave usata quando l'app si chiamava Alveola: letta una volta, poi sostituita da quella nuova. */
export const OLD_DRAFT_STORAGE_KEY = "alveola-impasto-bozza";

/** localStorage che, se la chiave nuova manca, legge ancora quella vecchia; al primo salvataggio la vecchia sparisce. */
const draftStorage = {
  getItem: (key: string) => localStorage.getItem(key) ?? (key === DRAFT_STORAGE_KEY ? localStorage.getItem(OLD_DRAFT_STORAGE_KEY) : null),
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    if (key === DRAFT_STORAGE_KEY) localStorage.removeItem(OLD_DRAFT_STORAGE_KEY);
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};

type ScalarKey = Exclude<keyof Dough, "preferments" | "phases" | "plan">;

type DoughState = {
  dough: Dough;
  setField: <K extends ScalarKey>(key: K, value: Dough[K]) => void;
  addPreferment: (type: PrefermentType) => void;
  updatePreferment: (id: string, patch: Partial<Omit<Preferment, "id">>) => void;
  /** Cambiando tipo, idratazione e lievito tornano ai valori tipici del nuovo prefermento. */
  changePrefermentType: (id: string, type: PrefermentType) => void;
  removePreferment: (id: string) => void;
  addPhase: (preset: (typeof PHASE_PRESETS)[number]) => void;
  setPlan: (patch: Partial<Plan>) => void;
  updatePhase: (id: string, patch: Partial<Omit<Phase, "id">>) => void;
  removePhase: (id: string) => void;
  reset: () => void;
  /** Sostituisce la bozza con un impasto (es. quello di una prova riuscita), con ora di inizio da adesso. */
  loadDough: (d: Dough) => void;
};

const initialDough = (): Dough => readLegacyDraft() ?? createDefaultDough();

export const useDoughStore = create<DoughState>()(
  persist(
    (set) => {
      const patch = (fn: (d: Dough) => Partial<Dough>) => set((s) => ({ dough: { ...s.dough, ...fn(s.dough) } }));
      return {
        dough: initialDough(),
        setField: (key, value) => patch(() => ({ [key]: value })),
        addPreferment: (type) => patch((d) => ({ preferments: [...d.preferments, createPreferment(type)] })),
        updatePreferment: (id, p) => patch((d) => ({ preferments: d.preferments.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
        changePrefermentType: (id, type) =>
          patch((d) => ({
            preferments: d.preferments.map((x) =>
              x.id === id ? { ...x, type, hydration: PREFERMENT_PRESETS[type].hydration, yeast: PREFERMENT_PRESETS[type].yeast } : x,
            ),
          })),
        removePreferment: (id) => patch((d) => ({ preferments: d.preferments.filter((x) => x.id !== id) })),
        addPhase: (preset) => patch((d) => ({ phases: [...d.phases, createPhaseFromPreset(preset)] })),
        setPlan: (p) => patch((d) => ({ plan: { ...d.plan, ...p } })),
        updatePhase: (id, p) => patch((d) => ({ phases: d.phases.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
        removePhase: (id) => patch((d) => ({ phases: d.phases.filter((x) => x.id !== id) })),
        reset: () => set({ dough: createDefaultDough() }),
        loadDough: (d) =>
          set({
            dough: DoughSchema.parse({
              ...structuredClone(d),
              start: nextQuarterHour(),
              plan: { ...d.plan, targetReady: "" },
            }),
          }),
      };
    },
    {
      name: DRAFT_STORAGE_KEY,
      // le bozze salvate da versioni precedenti vengono aggiornate (vedi data/draftMigration.ts)
      version: DRAFT_VERSION,
      migrate: (persisted, fromVersion) => migrateDraft(persisted, fromVersion) as never,
      storage: createJSONStorage(() => draftStorage),
      partialize: (s) => ({ dough: s.dough }),
      merge: (persisted, current) => {
        const parsed = DoughSchema.safeParse((persisted as { dough?: unknown } | undefined)?.dough);
        if (!parsed.success) return current;
        const dough = parsed.data.start ? parsed.data : { ...parsed.data, start: nextQuarterHour() };
        return { ...current, dough };
      },
    },
  ),
);

/** Analisi dell'impasto corrente, ricalcolata solo quando cambiano l'impasto o l'archivio farine. */
export function useDoughAnalysis() {
  const dough = useDoughStore((s) => s.dough);
  const { flours, loaded } = useFlourArchive();
  return useMemo(() => analyzeDough(dough, flours, { floursLoaded: loaded }), [dough, flours, loaded]);
}
