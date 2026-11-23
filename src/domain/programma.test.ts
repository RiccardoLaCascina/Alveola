import { describe, expect, it } from "vitest";
import type { Phase, Plan } from "./model";
import { maturationSummary } from "./lievito";
import { buildPlan, formatClock, planningFlags, toLocalDateTimeValue } from "./programma";

const phase = (patch: Partial<Phase>): Phase => ({ id: patch.name ?? "x", name: "Fase", hours: 2, temp: 22, ambient: false, balled: false, ...patch });
const PHASES = [
  phase({ name: "Puntata", hours: 2, temp: 22, ambient: true }),
  phase({ name: "Frigo", hours: 24, temp: 4 }),
  phase({ name: "Appretto", hours: 4, temp: 22, ambient: true, balled: true }),
];
const plan = (patch: Partial<Plan>): Plan => ({ mode: "forward", targetReady: "", adapt: "yeast", ...patch });
const norm = (phases = PHASES, ambientTemp: number | null = null, adapt: Plan["adapt"] = "yeast") =>
  maturationSummary(phases, { ambientTemp, adapt }).phases;

describe("buildPlan in avanti", () => {
  it("dall'ora di inizio: staglio prima dell'appretto, pronto dopo 30 h", () => {
    const p = buildPlan(plan({}), "2026-11-23T08:00", norm())!;
    expect(formatClock(p.start)).toBe("08:00");
    expect(toLocalDateTimeValue(p.balling!)).toBe("2026-11-24T10:00");
    expect(toLocalDateTimeValue(p.ready)).toBe("2026-11-24T14:00");
    expect(p.steps.map((s) => s.kind)).toEqual(["start", "phase", "phase", "balling", "phase", "ready"]);
  });
  it("senza ora di inizio non c'è programma", () => {
    expect(buildPlan(plan({}), "", norm())).toBeNull();
  });
});

describe("buildPlan all'indietro", () => {
  it("pronto alle 19:30 di domani: impasta alle 13:30 di oggi, staglio alle 15:30 di domani", () => {
    const p = buildPlan(plan({ mode: "backward", targetReady: "2026-11-24T19:30" }), "", norm())!;
    expect(toLocalDateTimeValue(p.start)).toBe("2026-11-23T13:30");
    expect(toLocalDateTimeValue(p.balling!)).toBe("2026-11-24T15:30");
    expect(toLocalDateTimeValue(p.ready)).toBe("2026-11-24T19:30");
  });

  it("con laboratorio caldo e tempi adattati, si impasta più tardi per essere pronti alla stessa ora", () => {
    const target = plan({ mode: "backward", targetReady: "2026-11-24T19:30", adapt: "times" });
    const normal = buildPlan(target, "", norm(PHASES, 22, "times"))!;
    const hot = buildPlan(target, "", norm(PHASES, 28, "times"))!;
    expect(hot.ready.getTime()).toBe(normal.ready.getTime());
    expect(hot.start.getTime()).toBeGreaterThan(normal.start.getTime());
    expect(hot.balling!.getTime()).toBeGreaterThan(normal.balling!.getTime());
  });

  it("senza ora obiettivo non c'è programma", () => {
    expect(buildPlan(plan({ mode: "backward" }), "2026-11-23T08:00", norm())).toBeNull();
  });
});

describe("planningFlags", () => {
  const msgs = (...args: Parameters<typeof planningFlags>) => planningFlags(...args).map((f) => f.message).join(" | ");

  it("chiede la temperatura del laboratorio se ci sono fasi ambiente", () => {
    expect(msgs(norm(), null, null, "yeast")).toContain("temperatura del laboratorio");
  });
  it("elenca le fasi adattate quando si adattano i tempi", () => {
    expect(msgs(norm(PHASES, 28, "times"), 28, null, "times")).toMatch(/Puntata 2,0 h → 1,\d h/);
  });
  it("avvisa se una fase cambia più del doppio", () => {
    expect(msgs(norm(PHASES, 12, "times"), 12, null, "times")).toContain("più del doppio");
  });
  it("consigli sull'umidità", () => {
    expect(msgs(norm(), 22, 30, "yeast")).toContain("Aria secca");
    expect(msgs(norm(), 22, 85, "yeast")).toContain("Aria umida");
  });
  it("se c'è la temperatura ma nessuna fase ambiente, lo dice (e non parla di 'fasi ambiente lente')", () => {
    const onlyFridge = norm([phase({ name: "Frigo", hours: 48, temp: 4 })], 14);
    const m = msgs(onlyFridge, 14, null, "yeast");
    expect(m).toContain("Nessuna fase è segnata");
    expect(m).not.toContain("saranno lente");
  });
  it("segnala se nessuna fase è in panetti", () => {
    expect(msgs(norm([phase({ name: "Puntata", hours: 3 })]), 22, null, "yeast")).toContain("Nessuna fase in panetti");
  });
});
