import { describe, expect, it } from "vitest";
import { computeComposition, portion, splitPreferment, grams } from "./impasto";
import { createDefaultDough, createPreferment } from "./presets";
import type { Dough } from "./model";

const base = (patch: Partial<Dough> = {}): Dough => ({ ...createDefaultDough(new Date(2026, 10, 23, 8)), ...patch });

describe("grams", () => {
  it("tratta vuoto, negativo e non finito come 0", () => {
    expect(grams(null)).toBe(0);
    expect(grams(undefined)).toBe(0);
    expect(grams(-5)).toBe(0);
    expect(grams(Number.NaN)).toBe(0);
    expect(grams(12.5)).toBe(12.5);
  });
});

describe("splitPreferment", () => {
  it("poolish al 100 %: metà farina e metà acqua", () => {
    expect(splitPreferment(400, 100)).toEqual({ flour: 200, water: 200 });
  });
  it("biga al 45 %: farina = peso / 1,45", () => {
    const s = splitPreferment(450, 45);
    expect(s.flour).toBeCloseTo(310.345, 3);
    expect(s.water).toBeCloseTo(139.655, 3);
  });
});

describe("computeComposition", () => {
  it("impasto diretto: 1000 g farina e 650 g acqua = 65 %", () => {
    const c = computeComposition(base());
    expect(c.hydration).toBeCloseTo(65);
    expect(c.totalWeight).toBe(1680);
  });

  it("la farina e l'acqua dei prefermenti entrano nell'idratazione totale", () => {
    const c = computeComposition(base({ flour: 800, water: 500, preferments: [{ ...createPreferment("poolish"), weight: 400 }] }));
    expect(c.totalFlour).toBeCloseTo(1000);
    expect(c.totalWater).toBeCloseTo(700);
    expect(c.hydration).toBeCloseTo(70);
  });

  it("il lievito secco vale tre volte il fresco", () => {
    const c = computeComposition(base({ yeastType: "dry", yeast: 1 }));
    expect(c.mainFreshYeast).toBe(3);
  });

  it("con 'nessun lievito' la quantità scritta viene ignorata", () => {
    expect(computeComposition(base({ yeastType: "none", yeast: 5 })).yeastRaw).toBe(0);
  });

  it("il lievito madre non porta lievito di birra", () => {
    const c = computeComposition(base({ preferments: [{ ...createPreferment("lmSolid"), yeast: 10 }] }));
    expect(c.prefermentYeast).toBe(0);
    expect(c.sourdoughWeight).toBe(200);
  });

  it("senza farina l'idratazione è 0, non Infinity", () => {
    expect(computeComposition(base({ flour: null })).hydration).toBe(0);
  });
});

describe("portion", () => {
  it("1680 g in panetti da 270 g: 6 panetti, avanzano 60 g", () => {
    expect(portion(1680, 270)).toEqual({ pieces: 6, remainder: 60 });
  });
  it("senza peso del panetto non calcola", () => {
    expect(portion(1680, null)).toBeNull();
    expect(portion(1680, 0)).toBeNull();
  });
});
