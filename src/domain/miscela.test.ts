import { describe, expect, it } from "vitest";
import type { Dough, Flour } from "./model";
import { createDefaultDough, createFlour, createPreferment } from "./presets";
import { computeComposition } from "./impasto";
import { blendFlags, blendProfile, blendSum, flourDistribution, normalizeBlend, plNote, resolveEffectiveW } from "./miscela";
import { analyzeDough } from "./analisi";

const flour = (id: string, patch: Partial<Flour>): Flour => ({ ...createFlour(0), id, name: id, ...patch });
const A = flour("A", { w: 300, pl: 0.55, protein: 12.5, absorption: 60 });
const B = flour("B", { w: 400, pl: 0.6, protein: 14.5, absorption: 66, type: "manitoba" });
const C = flour("C", { w: null, pl: null, protein: 11, absorption: null, type: "integrale" });
const ARCHIVE = [A, B, C];

const dough = (patch: Partial<Dough> = {}): Dough => ({ ...createDefaultDough(new Date(2026, 10, 23, 8)), ...patch });

describe("blendSum / normalizeBlend", () => {
  it("somma le quote ignorando i campi vuoti", () => {
    expect(blendSum([{ flourId: "A", percent: 70 }, { flourId: "B", percent: null }, { flourId: "C", percent: 30 }])).toBe(100);
  });
  it("riproporziona le quote a 1 e unisce la stessa farina scelta due volte", () => {
    expect(normalizeBlend([{ flourId: "A", percent: 30 }, { flourId: "B", percent: 30 }, { flourId: "A", percent: 60 }])).toEqual([
      { flourId: "A", share: 0.75 },
      { flourId: "B", share: 0.25 },
    ]);
  });
  it("miscela vuota o tutta a zero: nessuna quota", () => {
    expect(normalizeBlend([])).toEqual([]);
    expect(normalizeBlend([{ flourId: "A", percent: 0 }])).toEqual([]);
  });
});

describe("flourDistribution", () => {
  it("70 % A + 30 % B su 1000 g in vasca", () => {
    const d = dough({ flourBlend: [{ flourId: "A", percent: 70 }, { flourId: "B", percent: 30 }] });
    const dist = flourDistribution(d, computeComposition(d), ARCHIVE);
    expect(dist.unassignedGrams).toBe(0);
    expect(dist.usages.map((u) => [u.flourId, Math.round(u.grams), Math.round(u.percent)])).toEqual([
      ["A", 700, 70],
      ["B", 300, 30],
    ]);
  });

  it("un prefermento con miscela propria (biga 100 % manitoba) sposta i grammi giusti", () => {
    const biga = { ...createPreferment("poolish"), weight: 400, flourBlend: [{ flourId: "B", percent: 100 }] };
    const d = dough({ flour: 800, flourBlend: [{ flourId: "A", percent: 100 }], preferments: [biga] });
    const dist = flourDistribution(d, computeComposition(d), ARCHIVE);
    const a = dist.usages.find((u) => u.flourId === "A")!;
    const b = dist.usages.find((u) => u.flourId === "B")!;
    expect(a.mainGrams).toBeCloseTo(800);
    expect(a.prefermentGrams).toBe(0);
    expect(b.prefermentGrams).toBeCloseTo(200); // poolish 400 g al 100 % = 200 g di farina
    expect(b.percent).toBeCloseTo(20);
  });

  it("un prefermento senza miscela usa quella dell'impasto", () => {
    const poolish = { ...createPreferment("poolish"), weight: 400 };
    const d = dough({ flour: 800, flourBlend: [{ flourId: "A", percent: 50 }, { flourId: "B", percent: 50 }], preferments: [poolish] });
    const dist = flourDistribution(d, computeComposition(d), ARCHIVE);
    expect(dist.usages.find((u) => u.flourId === "A")!.grams).toBeCloseTo(500);
  });

  it("senza miscela tutta la farina risulta non assegnata", () => {
    const d = dough();
    expect(flourDistribution(d, computeComposition(d), ARCHIVE)).toEqual({ usages: [], unassignedGrams: 1000 });
  });

  it("una farina eliminata dall'archivio resta visibile, senza dati", () => {
    const d = dough({ flourBlend: [{ flourId: "sparita", percent: 100 }] });
    const dist = flourDistribution(d, computeComposition(d), ARCHIVE);
    expect(dist.usages[0]!.flour).toBeUndefined();
  });
});

describe("blendProfile", () => {
  it("W, P/L, proteine e assorbimento: media pesata sui grammi", () => {
    const d = dough({ flourBlend: [{ flourId: "A", percent: 70 }, { flourId: "B", percent: 30 }] });
    const p = blendProfile(flourDistribution(d, computeComposition(d), ARCHIVE));
    expect(p.w!.value).toBeCloseTo(330);
    expect(p.pl!.value).toBeCloseTo(0.565);
    expect(p.protein!.value).toBeCloseTo(13.1);
    expect(p.absorption!.value).toBeCloseTo(61.8);
    expect(p.w!.coverage).toBeCloseTo(1);
  });

  it("se una farina non ha il dato, il valore è parziale (copertura < 1)", () => {
    const d = dough({ flourBlend: [{ flourId: "A", percent: 80 }, { flourId: "C", percent: 20 }] });
    const p = blendProfile(flourDistribution(d, computeComposition(d), ARCHIVE));
    expect(p.w!.value).toBeCloseTo(300);
    expect(p.w!.coverage).toBeCloseTo(0.8);
    expect(p.protein!.value).toBeCloseTo(12.2);
    expect(p.protein!.coverage).toBeCloseTo(1);
  });
});

describe("blendFlags", () => {
  const flagsFor = (d: Dough) => {
    const c = computeComposition(d);
    const dist = flourDistribution(d, c, ARCHIVE);
    return blendFlags(d, dist, blendProfile(dist), c.hydration).map((f) => f.message);
  };

  it("segnala una miscela che non somma a 100 %", () => {
    expect(flagsFor(dough({ flourBlend: [{ flourId: "A", percent: 60 }, { flourId: "B", percent: 30 }] })).join(" ")).toContain("somma a 90,0 %");
  });
  it("non segnala niente sulla somma se è 100 %", () => {
    expect(flagsFor(dough({ flourBlend: [{ flourId: "A", percent: 100 }] })).join(" ")).not.toContain("somma");
  });
  it("avvisa se l'idratazione supera di molto l'assorbimento", () => {
    // A assorbe 60 %, impasto al 70 %
    expect(flagsFor(dough({ water: 700, flourBlend: [{ flourId: "A", percent: 100 }] })).join(" ")).toContain("oltre l’assorbimento");
  });
});

describe("plNote", () => {
  it("classifica il P/L", () => {
    expect(plNote(0.3)).toContain("estensibile");
    expect(plNote(0.55)).toBe("equilibrata");
    expect(plNote(0.9)).toContain("tenace");
  });
});

describe("resolveEffectiveW", () => {
  it("miscela che copre tutta la farina: vale la W della miscela", () => {
    expect(resolveEffectiveW({ value: 330, coverage: 1 }, 150)).toEqual({ value: 330, source: "blend", coverage: 1 });
  });
  it("copertura parziale + W scritta a mano: la W manuale vale per la parte scoperta", () => {
    const r = resolveEffectiveW({ value: 400, coverage: 0.2 }, 250);
    expect(r.source).toBe("mixed");
    expect(r.value).toBeCloseTo(400 * 0.2 + 250 * 0.8);
  });
  it("copertura parziale senza W manuale: W parziale, segnalata come tale", () => {
    expect(resolveEffectiveW({ value: 400, coverage: 0.2 }, null)).toEqual({ value: 400, source: "partial", coverage: 0.2 });
  });
  it("nessuna W dalla miscela: vale quella scritta a mano, o niente", () => {
    expect(resolveEffectiveW(null, 280)).toEqual({ value: 280, source: "manual", coverage: 0 });
    expect(resolveEffectiveW(null, null)).toEqual({ value: null, source: null, coverage: 0 });
  });
  it("archivio in caricamento: nessuna W, per non mostrare valori sbagliati", () => {
    expect(resolveEffectiveW({ value: 330, coverage: 1 }, 150, { loading: true }).source).toBe("loading");
  });
});

describe("analyzeDough con le farine", () => {
  it("usa la W della miscela al posto di quella scritta a mano", () => {
    const a = analyzeDough(dough({ flourW: 150, flourBlend: [{ flourId: "B", percent: 100 }] }), ARCHIVE);
    expect(a.flours.effectiveW).toMatchObject({ value: 400, source: "blend" });
  });
  it("senza miscela usa la W scritta a mano", () => {
    expect(analyzeDough(dough({ flourW: 280 }), ARCHIVE).flours.effectiveW).toMatchObject({ value: 280, source: "manual" });
  });
  it("solo la biga ha la W (20 % della farina): la W manuale resta per il resto dell'impasto", () => {
    const biga = { ...createPreferment("poolish"), weight: 400, flourBlend: [{ flourId: "B", percent: 100 }] };
    const a = analyzeDough(dough({ flour: 800, flourW: 250, preferments: [biga] }), ARCHIVE);
    expect(a.flours.effectiveW.source).toBe("mixed");
    expect(a.flours.effectiveW.value).toBeCloseTo(400 * 0.2 + 250 * 0.8);
  });
  it("con l'archivio ancora in caricamento non dà avvisi sulle farine", () => {
    const a = analyzeDough(dough({ flourBlend: [{ flourId: "A", percent: 100 }] }), [], { floursLoaded: false });
    expect(a.flours.loading).toBe(true);
    expect(a.flours.flags).toEqual([]);
  });
});

describe("casi limite della scheda farina e delle quote", () => {
  it("un valore 0 nella scheda vale come dato mancante", () => {
    const zero = flour("Z", { w: 0, absorption: 0, protein: 12 });
    const d = dough({ flourBlend: [{ flourId: "Z", percent: 50 }, { flourId: "A", percent: 50 }] });
    const p = blendProfile(flourDistribution(d, computeComposition(d), [zero, A]));
    expect(p.w!.value).toBe(300);
    expect(p.w!.coverage).toBeCloseTo(0.5);
    expect(p.absorption!.value).toBe(60);
  });
  it("quote tutte vuote: avviso dedicato, non 'riproporzionate'", () => {
    const d = dough({ flourBlend: [{ flourId: "A", percent: null }] });
    const c = computeComposition(d);
    const dist = flourDistribution(d, c, ARCHIVE);
    const msgs = blendFlags(d, dist, blendProfile(dist), c.hydration).map((f) => f.message).join(" ");
    expect(msgs).toContain("non ha quote valide");
    expect(msgs).not.toContain("riproporzionate");
  });
  it("un prefermento con miscela propria senza quote valide usa quella dell'impasto", () => {
    const pf = { ...createPreferment("poolish"), weight: 400, flourBlend: [{ flourId: "B", percent: null }] };
    const d = dough({ flour: 800, flourBlend: [{ flourId: "A", percent: 100 }], preferments: [pf] });
    const dist = flourDistribution(d, computeComposition(d), ARCHIVE);
    expect(dist.unassignedGrams).toBe(0);
    expect(dist.usages.map((u) => u.flourId)).toEqual(["A"]);
  });
});
