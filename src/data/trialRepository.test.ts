import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { LievoraDB } from "./db";
import { createTrialRepository } from "./trialRepository";
import { analyzeDough } from "@/domain/analisi";
import { createDefaultDough } from "@/domain/presets";
import { createTrial, rateTrial } from "@/domain/prova";

const trial = (now: number) => {
  const d = createDefaultDough(new Date(2026, 10, 23, 8));
  return createTrial({ dough: d, archive: [], analysis: analyzeDough(d), measured: { waterTemp: 16, doughTemp: 24, ambientTemp: 22, ambientHumidity: 60 }, now });
};

describe("trialRepository", () => {
  it("salva, elenca dalla più recente, aggiorna ed elimina", async () => {
    const db = new LievoraDB("trials-test");
    const repo = createTrialRepository(db);
    const first = await repo.save(trial(1000));
    const second = await repo.save(trial(2000));
    expect((await repo.list()).map((t) => t.id)).toEqual([second.id, first.id]);

    await repo.save(rateTrial(first, { extensibility: 4, rim: 4, crumb: 3, bake: 5 }, "ok", 3000));
    expect((await repo.get(first.id))!.status).toBe("done");

    await repo.remove(first.id);
    expect(await repo.get(first.id)).toBeUndefined();
    await db.delete();
  });
});
