import { z } from "zod";
import { centerOn } from "../../engine/geometry.ts";
import {
  defaultElement,
  type Element,
  type ElementKind,
} from "../../model/model.ts";
import { resolveElement } from "../../presets/resolve.ts";
import { findElement, insertChild } from "../element-tree.ts";
import { COORDINATES, checkKind, patched } from "../elements.ts";
import { trimImage } from "../image-trim.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, findPreset, SceneResult } from "../scenes.ts";

export const elementAdd = defineTool({
  name: "element_add",
  description:
    "Add an element on top of a scene (or inside a `group` when `parent` is given by `id` or " +
    "`group/child` path), built from a preset (see preset_list) or from a component kind's " +
    "defaults (see component_list). `set` deep-merges field values (tracks and animPreset " +
    "included); `at` centres it on a point, else it is centred on the scene (or the parent " +
    "group's content area) unless `set` gives its position. " +
    "`trim: true` on an image crops it to its visible pixels first (see image_trim). " +
    "Returns the new element's id. " +
    COORDINATES,
  input: z
    .object({
      scene: z.string().min(1),
      project: PROJECT,
      preset: z.string().min(1).optional(),
      kind: z.string().min(1).optional(),
      parent: z.string().min(1).optional(),
      at: z.object({ x: z.number(), y: z.number() }).optional(),
      set: z.record(z.string(), z.unknown()).optional(),
      trim: z.boolean().optional(),
    })
    .refine((i) => (i.preset === undefined) !== (i.kind === undefined), {
      message: "Indica un preset o un tipo, no ambos",
      path: ["preset"],
    }),
  output: SceneResult.extend({ id: z.string() }),
  async run({ scene, project, preset, kind, parent, at, set, trim }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    const notices: string[] = [];
    if (set) {
      const assetKeys = ["src", "assetId", "image", "audio"];
      for (const key of assetKeys) {
        const val = set[key];
        if (typeof val === "string" && val.length > 0) {
          const check = await ctx.projects.checkAsset(
            effectiveCtx.project,
            val,
          );
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
    // trimmed before the scene is opened, so a failure adds nothing (049/D4)
    if (trim) el = await trimImage(effectiveCtx, el, "trim");
    const added = el;
    const placed = set && ["x", "y", "a", "b"].some((k) => k in set);
    const result = await editScene(effectiveCtx, scene, (s) => {
      if (parent !== undefined) {
        const group = findElement(s.elements, parent, "parent");
        if (group.kind !== "group") {
          fail(
            "not_a_group",
            `El elemento «${parent}» no es un grupo`,
            "parent",
          );
        }
        const p =
          at ?? (placed ? undefined : { x: group.cw / 2, y: group.ch / 2 });
        const out = p ? centerOn(added, p.x, p.y) : added;
        return {
          ...s,
          elements: insertChild(s.elements, parent, out, "parent"),
        };
      }
      const p =
        at ?? (placed ? undefined : { x: s.width / 2, y: s.height / 2 });
      const out = p ? centerOn(added, p.x, p.y) : added;
      return { ...s, elements: [...s.elements, out] };
    });
    return {
      ...result,
      notices: [...result.notices, ...notices],
      id: added.id,
    };
  },
});
