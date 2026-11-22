import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { LievoraDB, migrateFromOldName } from "./db";
import { createFlour } from "@/domain/presets";

describe("migrateFromOldName", () => {
  it("sposta le farine dal database 'alveola' a quello nuovo e cancella il vecchio", async () => {
    const old = new LievoraDB("old-db-test");
    const f = { ...createFlour(1), name: "Pizzeria" };
    await old.flours.put(f);
    old.close();

    const target = new LievoraDB("new-db-test");
    expect(await migrateFromOldName(target, "old-db-test")).toBe(1);
    expect(await target.flours.get(f.id)).toEqual(f);
    expect(await Dexie.exists("old-db-test")).toBe(false);
    await target.delete();
  });

  it("senza vecchio database non fa niente", async () => {
    const target = new LievoraDB("new-db-test-2");
    expect(await migrateFromOldName(target, "non-esiste")).toBe(0);
    await target.delete();
  });
});
