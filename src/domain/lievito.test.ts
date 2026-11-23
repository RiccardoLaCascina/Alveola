import { describe, expect, it } from "vitest";
import { maturationSummary, normalizePhase, suggestedFreshYeastPercent, tempBand, yeastActivity } from "./lievito";
import type { Phase } from "./model";

describe("yeastActivity", () => {
  it("vale 1 a 24 °C e raddoppia ogni 7 °C", () => {
    expect(yeastActivity(24)).toBe(1);
    expect(yeastActivity(31)).toBeCloseTo(2);
    expect(yeastActivity(17)).toBeCloseTo(0.5);
  });
  it("è quasi ferma sotto i 2 °C", () => {
    expect(yeastActivity(1)).toBe(0.03);
    expect(yeastActivity(-3)).toBe(0.03);
  });
  it("non cresce oltre i 35 °C", () => {
    expect(yeastActivity(40)).toBe(yeastActivity(35));
  });
});

describe("suggestedFreshYeastPercent", () => {
  it("resta tra 0,02 % e 4 %", () => {
    expect(suggestedFreshYeastPercent(0.1)).toBe(4);
    expect(suggestedFreshYeastPercent(10_000)).toBe(0.02);
  });
  it("più ore equivalenti = meno lievito", () => {
    expect(suggestedFreshYeastPercent(24)).toBeLessThan(suggestedFreshYeastPercent(8));
  });
});

const phase = (patch: Partial<Phase>): Phase => ({ id: "a", name: "Fase", hours: 2, temp: 22, ambient: false, balled: false, ...patch });

describe("maturationSummary", () => {
  it("24 h in frigo a 4 °C valgono poco più di 3 h a 24 °C", () => {
    const m = maturationSummary([phase({ name: "Frigo", hours: 24, temp: 4 })]);
    expect(m.totalHours).toBe(24);
    expect(m.coldHours).toBe(24);
    expect(m.equivalentHours).toBeCloseTo(3.31, 2);
  });
  it("campi vuoti: durata 0, temperatura 20 °C, nome 'Fase'", () => {
    const m = maturationSummary([phase({ name: "  ", hours: null, temp: null })]);
    expect(m.phases[0]).toMatchObject({ id: "a", name: "Fase", hours: 0, temp: 20, adapted: false });
  });
});

describe("fasi ambiente e temperatura di oggi", () => {
  const puntata = phase({ name: "Puntata", hours: 2, temp: 22, ambient: true });
  const frigo = phase({ id: "f", name: "Frigo", hours: 24, temp: 4 });

  it("senza temperatura di oggi le fasi restano come scritte", () => {
    expect(normalizePhase(puntata, { ambientTemp: null, adapt: "times" })).toMatchObject({ hours: 2, temp: 22, adapted: false });
  });

  it("adatta il lievito: stessa durata, temperatura di oggi → meno lievito se fa più caldo", () => {
    const planned = maturationSummary([puntata, frigo]);
    const hot = maturationSummary([puntata, frigo], { ambientTemp: 29, adapt: "yeast" });
    expect(hot.phases[0]).toMatchObject({ hours: 2, temp: 29, adapted: true });
    expect(hot.equivalentHours).toBeGreaterThan(planned.equivalentHours);
    expect(suggestedFreshYeastPercent(hot.equivalentHours)).toBeLessThan(suggestedFreshYeastPercent(planned.equivalentHours));
  });

  it("adatta i tempi: la fase ambiente si accorcia e la maturazione vale lo stesso", () => {
    const planned = maturationSummary([puntata, frigo]);
    const hot = maturationSummary([puntata, frigo], { ambientTemp: 29, adapt: "times" });
    expect(hot.phases[0]!.hours).toBeCloseTo(2 * yeastActivity(22) / yeastActivity(29));
    expect(hot.phases[0]!.hours).toBeLessThan(2);
    expect(hot.equivalentHours).toBeCloseTo(planned.equivalentHours);
  });

  it("il frigo non è una fase ambiente e non cambia", () => {
    const m = maturationSummary([frigo], { ambientTemp: 29, adapt: "times" });
    expect(m.phases[0]).toMatchObject({ hours: 24, temp: 4, adapted: false });
  });
});

describe("tempBand", () => {
  it("divide le temperature in tre fasce", () => {
    expect(tempBand(4)).toBe("cold");
    expect(tempBand(15)).toBe("mild");
    expect(tempBand(22)).toBe("warm");
  });
});
