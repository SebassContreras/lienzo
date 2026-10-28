import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "../tools/index.ts";

const SERVICE = join(import.meta.dirname, "..");

/** Every `<feature>/tools/<tool>.ts` that is not a test, with its source. */
const toolFiles = readdirSync(SERVICE, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((feature) => {
    const dir = join(SERVICE, feature.name, "tools");
    try {
      return readdirSync(dir)
        .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
        .map((file) => readFileSync(join(dir, file), "utf8"));
    } catch {
      return [];
    }
  });

const nameOf = (source: string) => /name: "([a-z_]+)"/.exec(source)?.[1] ?? "";
const effectsOf = (name: string) =>
  registry.tools.find((tool) => tool.name === name)?.effects;

const sceneWriters = toolFiles
  .filter((source) => /\b(saveScene|editScene|writeScene)\(/.test(source))
  .map(nameOf);
const readers = registry.tools
  .map((tool) => tool.name)
  .filter((name) => /_(list|get|inspect|validate|inspect_layout)$/.test(name));

describe("the tool registry", () => {
  it("lists every tool file once, so a tool that is not registered fails here", () => {
    const registered = registry.tools.map((tool) => tool.name).sort();

    expect(registered).toEqual(toolFiles.map(nameOf).sort());
  });

  it("gives each tool a distinct snake_case name", () => {
    const names = registry.tools.map((tool) => tool.name);

    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((name) => !/^[a-z]+(_[a-z]+)+$/.test(name))).toEqual(
      [],
    );
  });
});

describe("a tool's declared effects", () => {
  it("are found for the scene writers and the readers the checks below walk", () => {
    expect(sceneWriters.length).toBeGreaterThan(10);
    expect(readers.length).toBeGreaterThan(5);
  });

  it.each(sceneWriters)(
    "%s saves a scene, so it declares the scene effect",
    (name) => {
      expect(effectsOf(name)).toContain("scene");
    },
  );

  it.each(readers)("%s only reads, so it declares no effect", (name) => {
    expect(effectsOf(name)).toEqual([]);
  });
});
