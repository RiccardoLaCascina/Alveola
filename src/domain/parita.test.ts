import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/legacy-parity.json";
import type { Dough } from "./model";
import { convertLegacyDraft } from "@/data/legacyDraft";
import { analyzeDough } from "./analisi";
import { fmt, fmtGrams } from "./format";
import { formatScheduleTime } from "./programma";

/*
  Test di parità: la prima versione (legacy/index.html) è stata eseguita in un browser con
  gli scenari di scripts/legacy-scenarios.json, e quello che mostrava è salvato in
  __fixtures__/legacy-parity.json (vedi scripts/capture-legacy.mjs).
  Qui verifichiamo che il nuovo dominio produca ESATTAMENTE gli stessi valori.
*/

// La conversione usa lo stesso codice che importa la bozza della prima versione sul telefono:
// così il test verifica anche l'importazione.
function toDough(state: unknown): Dough {
  const d = convertLegacyDraft(state);
  if (!d) throw new Error("scenario non convertibile");
  return d;
}

/** Rende l'analisi con gli stessi testi della prima versione. */
function render(d: Dough) {
  const a = analyzeDough(d);
  const c = a.composition;
  return {
    hydration: c.totalFlour > 0 ? `${fmt(c.hydration, 1)}%` : "—",
    hydrationNote: a.hydrationNote,
    total: c.totalWeight > 0 ? `${fmt(c.totalWeight)} g` : "—",
    bakers: [
      ...a.bakers.map((r) => [r.label, `${fmtGrams(r.grams)} g`, `${fmt(r.percent, 1)} %`]),
      ["Peso impasto", `${fmt(c.totalWeight)} g`, ""],
    ],
    compositionFlags: a.compositionFlags,
    pieces: a.portion ? `${a.portion.pieces} ${a.portion.pieces === 1 ? "panetto" : "panetti"}` : "—",
    rest: a.portion ? `avanzano ${fmt(a.portion.remainder)} g` : "",
    yeast: a.yeast ? `${fmtGrams(a.yeast.freshGrams)} g` : "—",
    yeastNote: a.yeast
      ? `${fmt(a.yeast.percent, 2)} % sulla farina totale · secco ${fmt(a.yeast.dryGrams, 1)} g`
      : a.maturation.equivalentHours > 0
        ? "Inserisci la farina per calcolare la dose."
        : "Aggiungi le fasi di maturazione.",
    maturation: a.yeast
      ? [
          ["Durata totale", `${fmt(a.maturation.totalHours, 1)} h`],
          ["Di cui al freddo", `${fmt(a.maturation.coldHours, 1)} h`],
          ["Equivalenti a 24 °C", `${fmt(a.maturation.equivalentHours, 1)} h`],
          ["Lievito nell’impasto ora", `${fmt(c.mainFreshYeast, 1)} g · ${fmt(a.yeast.currentPercent, 2)} %`],
        ]
      : [],
    waterTemp: a.waterTemp !== null ? `${fmt(a.waterTemp, 0)} °C` : "—",
    w: a.recommendedW ? `W ${a.recommendedW.min}–${a.recommendedW.max}` : "—",
    wNote: a.recommendedW ? a.recommendedW.label + (a.recommendedW.raisedForHydration ? ", alzata per l’alta idratazione" : "") : "",
    maturationFlags: a.maturationFlags,
    schedule: a.schedule
      ? a.schedule.map((s) => [s.kind === "phase" ? `${s.label} (${fmt(s.hours, 1)} h)` : s.label, formatScheduleTime(s.at)])
      : [["Imposta l’ora di inizio e le fasi.", ""]],
  };
}

describe("parità con la prima versione", () => {
  for (const f of fixtures) {
    it(`scenario "${f.name}"`, () => {
      expect(render(toDough(f.state))).toEqual(f.shown);
    });
  }
});
