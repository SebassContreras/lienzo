import { describe, expect, it } from "vitest";
import { lazyModule } from "./lazy-module.ts";

describe("lazyModule", () => {
  it("has no module until the import resolves, then returns it", async () => {
    const lazy = lazyModule(async () => ({ name: "set" }));

    expect(lazy.get()).toBeUndefined();
    await lazy.load();

    expect(lazy.get()).toEqual({ name: "set" });
  });

  it("imports once however many times it is asked", async () => {
    let imports = 0;
    const lazy = lazyModule(async () => ({ n: ++imports }));

    await Promise.all([lazy.load(), lazy.load()]);
    lazy.get();

    expect(imports).toBe(1);
  });

  it("tries the import again after it failed", async () => {
    let attempts = 0;
    const lazy = lazyModule(async () => {
      attempts++;
      if (attempts === 1) throw new Error("offline");
      return { ok: true };
    });

    await expect(lazy.load()).rejects.toThrow("offline");
    await lazy.load();

    expect(lazy.get()).toEqual({ ok: true });
  });
});
