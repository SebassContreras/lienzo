import { describe, expect, it } from "vitest";
import type { Descriptor } from "../components/descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  dataFields,
  type Fields,
  glow,
  noGlow,
  shadow,
  softShadow,
} from "../components/fields/index.ts";
import { COMPONENTS, createElement, KINDS } from "../components/index.ts";
import { WIDGET_NAMES } from "../editor/field-editor.tsx";
import { inspectorLayout } from "../editor/layout.ts";
import { defaultScene, type Element, type Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { parsePresetRecipe, parseScene } from "../model/schema.ts";
import { BUILT_IN_BACKGROUNDS, BUILT_IN_RECIPES } from "../presets/recipes.ts";
import { LegacySceneSchema } from "./legacy-schema.ts";
import { installCanvasFakes } from "./recording-ctx.ts";

installCanvasFakes();
const { goldenScenes } = await import("./golden-scenes.ts");

const descriptors = COMPONENTS as unknown as Descriptor<Element>[];

/** Every leaf value's path in `v` (objects and arrays opened). */
function leaves(
  v: unknown,
  path: (string | number)[] = [],
): (string | number)[][] {
  if (v && typeof v === "object") {
    return Object.entries(v).flatMap(([k, x]) =>
      leaves(x, [...path, Array.isArray(v) ? Number(k) : k]),
    );
  }
  return [path];
}

function setAt(root: unknown, path: (string | number)[], value: unknown) {
  const copy = structuredClone(root) as Record<string | number, unknown>;
  let o = copy;
  for (const k of path.slice(0, -1)) o = o[k] as typeof o;
  const last = path[path.length - 1] as string | number;
  if (value === undefined) delete o[last];
  else o[last] = value;
  return copy;
}

/** A value of the wrong type for whatever is at `path`. */
const wrong = (v: unknown) => (typeof v === "string" ? 3 : "x");

function sameVerdict(data: unknown) {
  const now = parseScene(data);
  const before = LegacySceneSchema.safeParse(data);
  expect(now.ok, JSON.stringify(data).slice(0, 200)).toBe(before.success);
  if (now.ok && before.success) expect(now.value).toEqual(before.data);
}

describe("the generated scene schema", () => {
  const scenes = goldenScenes();

  it.each(Object.keys(scenes))("accepts «%s» as the old schema did", (name) => {
    sameVerdict(scenes[name]);
  });

  it("agrees with the old schema on every broken or missing value", () => {
    const scene = scenes.kinds as Scene;
    for (const path of leaves(scene.elements)) {
      const full = ["elements", ...path];
      const value = full.reduce<unknown>(
        (o, k) => (o as Record<string | number, unknown>)[k],
        scene,
      );
      sameVerdict(setAt(scene, full, wrong(value)));
      sameVerdict(setAt(scene, full, undefined));
    }
  });

  it("agrees on the particle limits and on unknown kinds", () => {
    const particles = createElement("particles");
    for (const [key, values] of [
      ["count", [0, 1, 300, 301, 1.5]],
      ["speed", [0, 1, 2.5, 6]],
      ["drift", [-1, 0, 500]],
    ] as const) {
      for (const v of values) {
        sameVerdict({
          ...defaultScene(),
          elements: [{ ...particles, [key]: v }],
        });
      }
    }
    sameVerdict({
      ...defaultScene(),
      elements: [{ ...createElement("rect"), kind: "star" }],
    });
  });

  it("opens every built-in preset and background", () => {
    for (const r of [...BUILT_IN_RECIPES, ...BUILT_IN_BACKGROUNDS]) {
      expect(parsePresetRecipe(r as PresetRecipe).ok, r.name).toBe(true);
    }
  });

  it("accepts a new element of every kind", () => {
    const elements = KINDS.map((k) => createElement(k));
    expect(parseScene({ ...defaultScene(), elements }).ok).toBe(true);
  });
});

/** Fields kept out of the inspector on purpose, and why. */
const NOT_IN_INSPECTOR: Record<string, string[]> = {
  // dragged on the stage
  "*": ["x", "y"],
  // square: the size control sets both sides
  icon: ["h"],
  // read from the uploaded file
  image: ["aspect"],
  // the content and its space follow from grouping
  group: ["cw", "ch", "children"],
  // resized on the stage, or with "Ajustar al lienzo"
  particles: ["w", "h"],
};

/** Every data field's path, objects opened into their fields. */
function fieldPaths(fields: Fields, prefix = ""): string[] {
  return dataFields(fields).flatMap(([k, f]) =>
    f.type === "object" ? fieldPaths(f.fields, `${prefix}${k}.`) : [prefix + k],
  );
}

describe("the generated inspector", () => {
  it.each(descriptors.map((d) => [d.kind, d] as const))(
    "edits every field of «%s»",
    (kind, d) => {
      const shown = inspectorLayout(d, createElement(d.kind as never), true)
        .flatMap((s) => s.items)
        .filter((it) => it.field.type !== "widget")
        .map((it) => it.path.join("."));
      const hidden = [
        ...(NOT_IN_INSPECTOR["*"] ?? []),
        ...(NOT_IN_INSPECTOR[kind] ?? []),
      ];
      const missing = fieldPaths(d.fields).filter(
        (p) => !shown.includes(p) && !hidden.includes(p),
      );
      expect(missing).toEqual([]);
      // and nothing is hidden that the inspector shows anyway
      expect(shown.filter((p) => hidden.includes(p))).toEqual([]);
    },
  );

  it.each(descriptors.map((d) => [d.kind, d] as const))(
    "«%s» puts every control in a section it declares, and has a widget for each custom one",
    (_kind, d) => {
      const layout = inspectorLayout(d, createElement(d.kind as never), true);
      const placed = layout.flatMap((s) => s.items).length;
      const all = Object.values(d.fields).filter(
        (f) => f.type === "widget" || f.inspector !== false,
      );
      // every top-level control lands in one of the sections
      for (const f of all) {
        expect(d.sections.map((s) => s.title)).toContain(f.section);
      }
      expect(placed).toBeGreaterThan(0);
      for (const s of layout) expect(s.items.length).toBeGreaterThan(0);
      for (const { field } of layout.flatMap((s) => s.items)) {
        if (field.type === "widget" || field.type === "custom") {
          expect(WIDGET_NAMES).toContain(field.widget);
        }
      }
    },
  );
});

describe("descriptors", () => {
  it("cover every kind once, each with a draw function and its animations", () => {
    expect(KINDS).toEqual([
      "rect",
      "ellipse",
      "icon",
      "image",
      "group",
      "text",
      "line",
      "particles",
    ]);
    for (const d of descriptors) {
      expect(typeof d.draw).toBe("function");
      expect(d.anims).toContain("none");
      expect(d.animatable.length).toBeGreaterThan(0);
      // what keyframes may animate are real number or color fields
      for (const p of d.animatable) expect(fieldPaths(d.fields)).toContain(p);
    }
  });

  it("compose the shared field groups instead of redefining them", () => {
    const keys = (f: { fields: Fields }) => Object.keys(f.fields);
    const glowKeys = keys(glow(noGlow("#000000"), ""));
    const animKeys = keys(anim(BOX_ANIMS));
    const shadowKeys = keys(shadow(softShadow(true)));
    for (const d of descriptors) {
      for (const [name, f] of dataFields(d.fields)) {
        if (f.type !== "object") continue;
        if (/glow/i.test(name)) expect(keys(f), d.kind).toEqual(glowKeys);
        if (name === "anim") expect(keys(f), d.kind).toEqual(animKeys);
        if (name === "shadow") expect(keys(f), d.kind).toEqual(shadowKeys);
      }
      expect(dataFields(d.fields).some(([k]) => k === "anim")).toBe(true);
    }
  });
});
