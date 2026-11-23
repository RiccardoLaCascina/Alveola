import { describe, expect, it } from "vitest";
import { migrateDraft } from "./draftMigration";
import { DoughSchema } from "@/domain/model";
import { createDefaultDough, inferPhaseFlags } from "@/domain/presets";

describe("inferPhaseFlags", () => {
  it("deduce ambiente e panetti dal nome", () => {
    expect(inferPhaseFlags("Puntata")).toEqual({ ambient: true, balled: false });
    expect(inferPhaseFlags("Maturazione in frigo")).toEqual({ ambient: false, balled: false });
    expect(inferPhaseFlags("Appretto")).toEqual({ ambient: true, balled: true });
  });
});

describe("migrateDraft", () => {
  const oldDraft = () => {
    const d = createDefaultDough(new Date(2026, 10, 23, 8)) as Record<string, unknown>;
    // una bozza v1 non aveva i nuovi campi
    d.phases = (d.phases as Array<Record<string, unknown>>).map(({ ambient: _a, balled: _b, ...rest }) => rest);
    delete d.ambientTemp;
    delete d.ambientHumidity;
    delete d.plan;
    return { dough: d };
  };

  it("v1 → v2: puntata e appretto diventano ambiente, l'appretto in panetti; lo schema completa il resto", () => {
    const migrated = migrateDraft(oldDraft(), 1) as { dough: unknown };
    const parsed = DoughSchema.parse(migrated.dough);
    expect(parsed.phases.map((p) => [p.name, p.ambient, p.balled])).toEqual([
      ["Puntata", true, false],
      ["Maturazione in frigo", false, false],
      ["Appretto", true, true],
    ]);
    expect(parsed.plan).toEqual({ mode: "forward", targetReady: "", adapt: "yeast" });
    expect(parsed.ambientTemp).toBeNull();
  });

  it("non tocca i valori già presenti", () => {
    const d = oldDraft();
    (d.dough.phases as Array<Record<string, unknown>>)[0]!.ambient = false;
    const migrated = migrateDraft(d, 1) as { dough: { phases: Array<{ ambient: boolean }> } };
    expect(migrated.dough.phases[0]!.ambient).toBe(false);
  });

  it("una bozza già alla versione 2 resta com'è", () => {
    const d = { dough: createDefaultDough() };
    expect(migrateDraft(structuredClone(d), 2)).toEqual(d);
  });
});
