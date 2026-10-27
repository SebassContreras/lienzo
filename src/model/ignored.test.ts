import { describe, expect, it } from "vitest";
import { goldenScenes } from "../test/golden-scenes.ts";
import { ignoredFields, ignoredNotice, ignoredPaths } from "./ignored.ts";
import { defaultText } from "./model.ts";
import { parseScene } from "./schema.ts";

describe("ignoredPaths (063/R6)", () => {
  it("names a key the parsed value dropped by its full path", () => {
    // Arrange
    const input = {
      elements: [{ kind: "rect" }, { kind: "group", children: [{ glw: 1 }] }],
    };
    const parsed = {
      elements: [{ kind: "rect" }, { kind: "group", children: [{}] }],
    };

    // Act
    const paths = ignoredPaths(input, parsed);

    // Assert
    expect(paths).toEqual(["elements.1.children.0.glw"]);
  });

  it("finds nothing ignored in a scene that already parses cleanly", () => {
    // Arrange
    const scene = goldenScenes().kinds;
    const parsed = parseScene(scene);

    // Act
    const paths = parsed.ok ? ignoredPaths(scene, parsed.value) : ["unparsed"];

    // Assert
    expect(paths).toEqual([]);
  });
});

describe("ignored field suggestions (067/R3)", () => {
  /** The notices for a text element carrying `extra` on top of its own fields. */
  function noticesFor(extra: Record<string, unknown>): string[] {
    const scene = {
      ...goldenScenes().kinds,
      elements: [{ ...defaultText(), ...extra }],
    };
    const parsed = parseScene(scene);
    return parsed.ok
      ? ignoredFields(scene, parsed.value).map(ignoredNotice)
      : ["unparsed"];
  }

  it("suggests the field a CSS-style name means", () => {
    expect(noticesFor({ fontSize: 40 })).toEqual([
      "Campo desconocido ignorado: elements.0.fontSize (¿quisiste decir «size»?)",
    ]);
  });

  it("suggests the field a misspelled name is closest to", () => {
    expect(noticesFor({ colr: "#fff" })).toEqual([
      "Campo desconocido ignorado: elements.0.colr (¿quisiste decir «color»?)",
    ]);
  });

  it("suggests nothing for a name unlike any field", () => {
    expect(noticesFor({ zzz: 1 })).toEqual([
      "Campo desconocido ignorado: elements.0.zzz",
    ]);
  });
});
