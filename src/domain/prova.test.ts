import { describe, expect, it } from "vitest";
import { analyzeDough } from "./analisi";
import { createDefaultDough, createFlour } from "./presets";
import { averageRating, createTrial, doughTempDeviation, floursUsedBy, rateTrial } from "./prova";
import type { Flour } from "./model";

const A: Flour = { ...createFlour(0), id: "A", name: "Pizzeria", w: 300 };
const B: Flour = { ...createFlour(0), id: "B", name: "Manitoba", w: 400 };
const C: Flour = { ...createFlour(0), id: "C", name: "Non usata" };

const dough = () => ({
  ...createDefaultDough(new Date(2026, 10, 23, 8)),
  flourBlend: [{ flourId: "A", percent: 70 }, { flourId: "B", percent: 30 }],
  targetDoughTemp: 24,
});

const make = () => {
  const d = dough();
  return createTrial({
    dough: d,
    archive: [A, B, C],
    analysis: analyzeDough(d, [A, B, C]),
    measured: { waterTemp: 16, doughTemp: 25.5, ambientTemp: 23, ambientHumidity: 55 },
    title: "  Prima prova  ",
    now: 1000,
  });
};

describe("createTrial (momento 1, all'impasto)", () => {
  it("fotografa ricetta, farine usate, numeri chiave e misure", () => {
    const t = make();
    expect(t.status).toBe("toRate");
    expect(t.title).toBe("Prima prova");
    expect(t.flours.map((f) => f.id)).toEqual(["A", "B"]);
    expect(t.summary.hydration).toBeCloseTo(65);
    expect(t.summary.totalWeight).toBe(1680);
    expect(t.summary.effectiveW).toBeCloseTo(330);
    expect(t.summary.plannedReady).not.toBe("");
    expect(t.measured.doughTemp).toBe(25.5);
  });

  it("la fotografia non cambia se poi si modifica l'impasto", () => {
    const d = dough();
    const t = createTrial({ dough: d, archive: [A, B], analysis: analyzeDough(d, [A, B]), measured: { waterTemp: null, doughTemp: null, ambientTemp: null, ambientHumidity: null } });
    d.flour = 5000;
    d.phases[0]!.hours = 99;
    expect(t.dough.flour).toBe(1000);
    expect(t.dough.phases[0]!.hours).toBe(2);
  });
});

describe("rateTrial (momento 2, dopo la cottura)", () => {
  it("con tutti i voti la prova è completata", () => {
    const t = rateTrial(make(), { extensibility: 4, rim: 5, crumb: 4, bake: 3 }, "  Ottimo bordo ", 2000);
    expect(t.status).toBe("done");
    expect(t.comment).toBe("Ottimo bordo");
    expect(t.ratedAt).toBe(2000);
    expect(averageRating(t.ratings)).toBe(4);
  });
  it("con voti parziali resta da valutare", () => {
    const t = rateTrial(make(), { extensibility: 4, rim: null, crumb: null, bake: null }, "", 2000);
    expect(t.status).toBe("toRate");
    expect(averageRating(t.ratings)).toBe(4);
  });
  it("rifiuta voti fuori scala", () => {
    expect(() => rateTrial(make(), { extensibility: 6, rim: 1, crumb: 1, bake: 1 }, "")).toThrow();
  });
});

describe("utilità", () => {
  it("farine usate anche solo da un prefermento", () => {
    const d = { ...dough(), flourBlend: [{ flourId: "A", percent: 100 }] };
    d.preferments = [{ id: "p", type: "biga", weight: 450, hydration: 45, yeast: 3, flourBlend: [{ flourId: "B", percent: 100 }] }];
    expect(floursUsedBy(d, [A, B, C]).map((f) => f.id)).toEqual(["A", "B"]);
  });
  it("scarto della temperatura finale: misurata − voluta", () => {
    expect(doughTempDeviation(make())).toBeCloseTo(1.5);
  });
});
