import { describe, expect, it } from "vitest";
import { defaultScene } from "../model/model.ts";
import { createDraftGuard, readAutosave, writeAutosave } from "./autosave.ts";
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

  it("does not open a stored draft that is no longer a valid scene", () => {
    const storage = memoryStorage();
    storage.setItem("lienzo-scene:acme", JSON.stringify({ width: "x" }));

    expect(readAutosave("acme", storage)).toBeUndefined();
  });

  it("does not show one project's draft in another project", () => {
    const storage = memoryStorage();

    writeAutosave("acme", defaultScene(), storage);

    expect(readAutosave("otro", storage)).toBeUndefined();
  });
});

describe("createDraftGuard", () => {
  it("does not save the blank scene the editor shows on start", () => {
    const guard = createDraftGuard();
    const blank = defaultScene();
    guard.markPristine(blank);

    expect(guard.shouldSave(blank)).toBe(false);
  });

  it("does not save the start scene resized to the project's canvas defaults", () => {
    const guard = createDraftGuard();
    const blank = defaultScene();
    const resized = { ...blank, width: 1080, height: 1920 };
    guard.markPristine(blank);

    guard.carry(blank, resized);

    expect(guard.shouldSave(resized)).toBe(false);
  });

  it("saves the scene once the user edits it", () => {
    const guard = createDraftGuard();
    const blank = defaultScene();
    guard.markPristine(blank);

    expect(guard.shouldSave({ ...blank, duration: 6 })).toBe(true);
  });
});
