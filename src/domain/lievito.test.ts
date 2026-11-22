import { describe, expect, it } from "vitest";
import { maturationSummary, suggestedFreshYeastPercent, tempBand, yeastActivity } from "./lievito";

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

describe("maturationSummary", () => {
  it("24 h in frigo a 4 °C valgono poco più di 3 h a 24 °C", () => {
    const m = maturationSummary([{ id: "a", name: "Frigo", hours: 24, temp: 4 }]);
    expect(m.totalHours).toBe(24);
    expect(m.coldHours).toBe(24);
    expect(m.equivalentHours).toBeCloseTo(3.31, 2);
  });
  it("campi vuoti: durata 0, temperatura 20 °C, nome 'Fase'", () => {
    const m = maturationSummary([{ id: "a", name: "  ", hours: null, temp: null }]);
    expect(m.phases[0]).toEqual({ id: "a", name: "Fase", hours: 0, temp: 20 });
  });
});

describe("tempBand", () => {
  it("divide le temperature in tre fasce", () => {
    expect(tempBand(4)).toBe("cold");
    expect(tempBand(15)).toBe("mild");
    expect(tempBand(22)).toBe("warm");
  });
});
