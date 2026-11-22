import { describe, expect, it } from "vitest";
import { waterTemperature } from "./temperature";

describe("waterTemperature", () => {
  it("se farina e obiettivo sono uguali e l'impastatrice non scalda, l'acqua è alla stessa temperatura", () => {
    expect(waterTemperature({ targetDoughTemp: 22, flourTemp: 22, mixerRise: 0, flour: 1000, water: 650 })).toBeCloseTo(22);
  });

  it("l'impastatrice che scalda richiede acqua più fredda", () => {
    const still = waterTemperature({ targetDoughTemp: 24, flourTemp: 20, mixerRise: 0, flour: 1000, water: 650 })!;
    const spiral = waterTemperature({ targetDoughTemp: 24, flourTemp: 20, mixerRise: 5, flour: 1000, water: 650 })!;
    expect(spiral).toBeLessThan(still);
  });

  it("caso della prima versione: spirale, farina 20 °C, obiettivo 24 °C → circa 18 °C", () => {
    // (19 × (400 + 650) − 400 × 20) / 650 = 18,38
    expect(waterTemperature({ targetDoughTemp: 24, flourTemp: 20, mixerRise: 5, flour: 1000, water: 650 })).toBeCloseTo(18.385, 3);
  });

  it("senza acqua non si può calcolare", () => {
    expect(waterTemperature({ targetDoughTemp: 24, flourTemp: 20, mixerRise: 5, flour: 1000, water: 0 })).toBeNull();
  });
});
