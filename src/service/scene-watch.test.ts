import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sceneChangeOf } from "./scene-watch.ts";

const ROOT = join("repo", "lienzo");

describe("sceneChangeOf", () => {
  it("names the project and scene of a project scene file", () => {
    const path = join(ROOT, "projects", "acme", "scenes", "lanzamiento.json");

    expect(sceneChangeOf(ROOT, path)).toEqual({
      project: "acme",
      name: "lanzamiento",
    });
  });

  it("ignores a file of a project that is not a scene", () => {
    const path = join(ROOT, "projects", "acme", "presets", "card.json");

    expect(sceneChangeOf(ROOT, path)).toBeUndefined();
  });

  it("ignores a non-JSON file in a scenes folder", () => {
    const path = join(ROOT, "projects", "acme", "scenes", "notes.txt");

    expect(sceneChangeOf(ROOT, path)).toBeUndefined();
  });

  it("ignores a scene in a nested folder", () => {
    const path = join(ROOT, "projects", "acme", "scenes", "old", "a.json");

    expect(sceneChangeOf(ROOT, path)).toBeUndefined();
  });

  it("ignores files outside the repo's projects", () => {
    const path = join(ROOT, "src", "scenes", "a.json");

    expect(sceneChangeOf(ROOT, path)).toBeUndefined();
  });
});
