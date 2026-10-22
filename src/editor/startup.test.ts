import { describe, expect, it } from "vitest";
import { defaultScene } from "../model/model.ts";
import { readAutosave, writeAutosave } from "./autosave.ts";
import { startupState } from "./startup.ts";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe("startupState", () => {
  it("opens an empty scene", () => {
    expect(startupState().scene.elements).toEqual([]);
  });

  it("opens paused", () => {
    expect(startupState().playing).toBe(false);
  });

  it("names the scene after the default project", () => {
    expect(startupState().name).toBe("Mi proyecto");
  });
});

describe("autosave drafts", () => {
  it("gives back the draft saved for the same project", () => {
    const storage = memoryStorage();
    const draft = { ...defaultScene(), duration: 7 };

    writeAutosave("acme", draft, storage);

    expect(readAutosave("acme", storage)).toEqual(draft);
  });

  it("does not show one project's draft in another project", () => {
    const storage = memoryStorage();

    writeAutosave("acme", defaultScene(), storage);

    expect(readAutosave("otro", storage)).toBeUndefined();
  });
});
