import { z } from "zod";
import { withCountUp } from "../../components/counter/count-up.ts";
import { AT_RULES, AtPlacementSchema } from "../../model/compact.ts";
import {
  defaultElement,
  type Element,
  type ElementKind,
} from "../../model/model.ts";
import { fromShotStart } from "../../model/shots.ts";
import { resolveElement } from "../../presets/resolve.ts";
import { applyImplied } from "../compact/implied.ts";
import { placeAt } from "../compact/layout.ts";
import { findElement, insertChild } from "../element-tree.ts";
import {
  COORDINATES,
  checkKind,
  hasPositionTrack,
  patched,
  trackOverridesAt,
} from "../elements.ts";
import { withFileAspect } from "../image-aspect.ts";
import { trimImage } from "../image-trim.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail, remapFailure, ToolFailure } from "../registry.ts";
import { editScene, findPreset, SceneResult } from "../scenes.ts";

/** `elements.<id>.…` (or `elements.<group>/<id>.…`) of the element `id` as `patch.…`. */
const atPatch =
  (id: string) =>
  (path: string): string => {
    const m = /^elements\.([^.]+)(\..*)?$/.exec(path);
    return m && m[1]?.split("/").at(-1) === id ? `patch${m[2] ?? ""}` : path;
  };

export const elementAdd = defineTool({
  name: "element_add",
  description:
    "Add an element on top of a scene (or inside a `group` when `parent` is given by `id` or " +
    "`group/child` path), built from a preset (see preset_list) or from a component kind's " +
    "defaults (see component_list). `patch` deep-merges field values (tracks and animPreset " +
    "included). " +
    AT_RULES +
    "It is placed in the scene (or the parent group's content area); with no `at` it is " +
    "centred there unless `patch` gives its position. " +
    'Shape options: `fit: "box"` stretches a polygon to fill its box (a `sides: 3` roof ' +
    "touches the bottom); `clip: true` (and `radius`) on a group clips its children without a " +
    'frame; `fill.type: "radial"` and `fill.stops: [{at, color}, …]` (at 0–1, 2+ stops, in ' +
    "order) give radial and multi-stop gradients when `fill.gradient` is on. " +
    "`trim: true` on an image crops it to its visible pixels first (see image_trim). " +
    "Returns the new element's id (`patch.id` names it; fails if taken) and a notice when it leaves " +
    "the canvas. A failure about the new element points at its input (`patch.w`, `patch.shot`). " +
    "A `shot`, icon, line target or symbol that does not exist fails, listing the valid " +
    "ones; icon names take any case (`star` → `Star`). A preset's own tracks start at its " +
    "shot's `start`. A bare asset path (`logos/x.png`) is stored with its project prefix. " +
    COORDINATES,
  input: z
    .object({
      scene: z.string().min(1),
      project: PROJECT,
      preset: z.string().min(1).optional(),
      kind: z.string().min(1).optional(),
      parent: z.string().min(1).optional(),
      at: AtPlacementSchema.optional(),
      patch: z.record(z.string(), z.unknown()).optional(),
      trim: z.boolean().optional(),
    })
    .superRefine((i, ctx) => {
      if (i.preset === undefined && i.kind === undefined)
        ctx.addIssue({
          code: "custom",
          message: "Indica un preset (preset_list) o un tipo (component_list)",
          path: ["preset"],
        });
      if (i.preset !== undefined && i.kind !== undefined)
        ctx.addIssue({
          code: "custom",
          message: "Indica un preset o un tipo, no ambos",
          path: ["preset"],
        });
    }),
  output: SceneResult.extend({ id: z.string() }),
  async run({ scene, project, preset, kind, parent, at, patch, trim }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    const notices: string[] = [];
    let el: Element;
    let presetTracks: string[] = [];
    if (preset !== undefined) {
      const r = resolveElement((await findPreset(effectiveCtx, preset)).recipe);
      if ("error" in r) fail("invalid_preset", r.error, "preset");
      el = r.element;
      // the recipe's tracks run in the element's shot time unless `patch` replaces them (074/D4)
      const given = (patch?.tracks ?? {}) as Record<string, unknown>;
      presetTracks = Object.keys(el.tracks ?? {}).filter((k) => !(k in given));
    } else {
      checkKind(kind as string);
      el = defaultElement(kind as ElementKind);
    }
    if (patch) {
      el = patched(el, patch);
      if (preset === undefined) applyImplied(el, patch);
    }
    if (patch) el = await withFileAspect(effectiveCtx, el, patch);
    // trimmed before the scene is opened, so a failure adds nothing (049/D4)
    if (trim) el = await trimImage(effectiveCtx, el, "trim");
    if (typeof patch?.id === "string" && patch.id) el = { ...el, id: patch.id };
    const added = el;
    if (at && hasPositionTrack(added)) notices.push(trackOverridesAt(added.id));
    const placed = patch && ["x", "y", "a", "b"].some((k) => k in patch);
    const write = editScene(effectiveCtx, scene, (s) => {
      const fresh =
        preset === undefined
          ? withCountUp(added, patch ?? {}, s)
          : fromShotStart(added, presetTracks, s.shots);
      if (parent !== undefined) {
        const group = findElement(s.elements, parent, "parent");
        if (group.kind !== "group") {
          fail(
            "not_a_group",
            `El elemento «${parent}» no es un grupo`,
            "parent",
          );
        }
        const p = at ?? (placed ? undefined : "center");
        const out = p
          ? placeAt(fresh, p, { width: group.cw, height: group.ch })
          : fresh;
        return {
          ...s,
          elements: insertChild(s.elements, parent, out, "parent"),
        };
      }
      const p = at ?? (placed ? undefined : "center");
      const out = p ? placeAt(fresh, p, s) : fresh;
      return { ...s, elements: [...s.elements, out] };
    });
    const result = await write.catch((err: unknown) => {
      // a failure about the new element points at what the caller gave: `patch.…` (078/D4)
      if (err instanceof ToolFailure)
        throw new ToolFailure(remapFailure(err.error, atPatch(added.id)));
      throw err;
    });
    return {
      ...result,
      notices: [...result.notices, ...notices],
      id: added.id,
    };
  },
});
