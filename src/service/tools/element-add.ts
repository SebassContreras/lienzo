import { z } from "zod";
import { centerOn } from "../../engine/geometry.ts";
import {
  defaultElement,
  type Element,
  type ElementKind,
} from "../../model/model.ts";
import { resolveElement } from "../../presets/resolve.ts";
import { checkKind, patched } from "../elements.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, findPreset, SceneResult } from "../scenes.ts";

export const elementAdd = defineTool({
  name: "element_add",
  description:
    "Add an element on top of a scene, built from a preset (see preset_list) or from a " +
    "component kind's defaults (see component_list). `set` deep-merges field values " +
    "(tracks and animPreset included); `at` centres it on a point, else it is centred on " +
    "the scene unless `set` gives its position. " +
    "Returns the new element's id.",
  input: z
    .object({
      scene: z.string().min(1),
      project: z.string().optional(),
      preset: z.string().min(1).optional(),
      kind: z.string().min(1).optional(),
      at: z.object({ x: z.number(), y: z.number() }).optional(),
      set: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((i) => (i.preset === undefined) !== (i.kind === undefined), {
      message: "Indica un preset o un tipo, no ambos",
      path: ["preset"],
    }),
  output: SceneResult.extend({ id: z.string() }),
  async run({ scene, project, preset, kind, at, set }, ctx) {
    const effectiveCtx = project
      ? {
          ...ctx,
          store: await ctx.projects.projectStore(project),
        }
      : ctx;

    const notices: string[] = [];
    if (project && set) {
      const assetKeys = ["src", "assetId", "image", "audio"];
      for (const key of assetKeys) {
        const val = set[key];
        if (typeof val === "string" && val.length > 0) {
          const check = await ctx.projects.checkAsset(project, val);
          if (!check.ok && check.warning) {
            notices.push(check.warning);
          }
        }
      }
    }

    let el: Element;
    if (preset !== undefined) {
      const r = resolveElement((await findPreset(effectiveCtx, preset)).recipe);
      if ("error" in r) fail("invalid_preset", r.error, "preset");
      el = r.element;
    } else {
      checkKind(kind as string);
      el = defaultElement(kind as ElementKind);
    }
    if (set) el = patched(el, set);
    const added = el;
    const placed = set && ["x", "y", "a", "b"].some((k) => k in set);
    const result = await editScene(effectiveCtx, scene, (s) => {
      const p =
        at ?? (placed ? undefined : { x: s.width / 2, y: s.height / 2 });
      const out = p ? centerOn(added, p.x, p.y) : added;
      return { ...s, elements: [...s.elements, out] };
    });
    return { ...result, notices: [...result.notices, ...notices], id: added.id };
  },
});
