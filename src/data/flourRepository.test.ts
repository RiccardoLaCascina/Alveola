import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { LievoraDB } from "./db";
import { createFlourRepository } from "./flourRepository";
import { createFlour } from "@/domain/presets";

let n = 0;
const fresh = () => {
  const db = new LievoraDB(`test-${++n}`);
  return { db, repo: createFlourRepository(db) };
};

describe("flourRepository", () => {
  let current: LievoraDB | null = null;
  afterEach(async () => {
    await current?.delete();
    current = null;
  });

  it("salva, rilegge ed elimina una farina", async () => {
    const { db, repo } = fresh();
    current = db;
    const f = { ...createFlour(1), name: "  Pizzeria  ", mill: "Molino Rossi", w: 300 };
    const saved = await repo.save(f, 5);
    expect(saved.name).toBe("Pizzeria");
    expect(saved.updatedAt).toBe(5);
    expect(await repo.get(f.id)).toEqual(saved);
    await repo.remove(f.id);
    expect(await repo.get(f.id)).toBeUndefined();
  });

  it("elenca in ordine alfabetico per nome, poi molino", async () => {
    const { db, repo } = fresh();
    current = db;
    await repo.save({ ...createFlour(), name: "Pizzeria", mill: "Alfa" });
    await repo.save({ ...createFlour(), name: "Manitoba", mill: "Zeta" });
    expect((await repo.list()).map((f) => f.name)).toEqual(["Manitoba", "Pizzeria"]);
  });

  it("rifiuta una farina non valida", async () => {
    const { db, repo } = fresh();
    current = db;
    await expect(repo.save({ ...createFlour(), type: "boh" as never })).rejects.toThrow();
  });
});
