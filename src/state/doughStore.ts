import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DoughSchema, type Dough, type Phase, type Preferment, type PrefermentType } from "@/domain/model";
import { PREFERMENT_PRESETS, createDefaultDough, createPhase, createPreferment, nextQuarterHour } from "@/domain/presets";
import { analyzeDough } from "@/domain/analisi";
import { readLegacyDraft } from "@/data/legacyDraft";
import { useFlourArchive } from "./flours";

/*
  Stato dell'impasto in lavorazione (la "bozza" di oggi), condiviso da tutte le schede.
  - Zustand: uno store piccolo e veloce; ogni componente si iscrive solo ai dati che usa.
  - persist: la bozza resta salvata sul telefono (localStorage) tra un'apertura e l'altra.
  - Al caricamento i dati salvati passano da DoughSchema: se non sono validi si riparte dall'esempio.
*/

export const DRAFT_STORAGE_KEY = "alveola-impasto-bozza";

type ScalarKey = Exclude<keyof Dough, "preferments" | "phases">;

type DoughState = {
  dough: Dough;
  setField: <K extends ScalarKey>(key: K, value: Dough[K]) => void;
  addPreferment: (type: PrefermentType) => void;
  updatePreferment: (id: string, patch: Partial<Omit<Preferment, "id">>) => void;
  /** Cambiando tipo, idratazione e lievito tornano ai valori tipici del nuovo prefermento. */
  changePrefermentType: (id: string, type: PrefermentType) => void;
  removePreferment: (id: string) => void;
  addPhase: (name: string, hours: number, temp: number) => void;
  updatePhase: (id: string, patch: Partial<Omit<Phase, "id">>) => void;
  removePhase: (id: string) => void;
  reset: () => void;
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
        addPhase: (name, hours, temp) => patch((d) => ({ phases: [...d.phases, createPhase(name, hours, temp)] })),
        updatePhase: (id, p) => patch((d) => ({ phases: d.phases.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
        removePhase: (id) => patch((d) => ({ phases: d.phases.filter((x) => x.id !== id) })),
        reset: () => set({ dough: createDefaultDough() }),
      };
    },
    {
      name: DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
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
