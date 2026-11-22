import { describe, expect, it } from "vitest";
import { DoughSchema } from "./model";
import { createDefaultDough } from "./presets";

describe("DoughSchema", () => {
  it("accetta l'impasto di esempio", () => {
    expect(DoughSchema.safeParse(createDefaultDough()).success).toBe(true);
  });
  it("rifiuta dati rovinati (es. salvati da una versione vecchia)", () => {
    expect(DoughSchema.safeParse({ flour: "mille" }).success).toBe(false);
    expect(DoughSchema.safeParse(null).success).toBe(false);
  });
});
