import { z } from "zod";
import { AT_RULES, AtPlacementSchema } from "../../model/compact.ts";
import { placeAt } from "../compact/layout.ts";
import { updateElement } from "../element-tree.ts";
import { COORDINATES, patched, patchNotices } from "../elements.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const elementUpdate = defineTool({
  name: "element_update",
  description:
    "Change an element (at root or inside nested groups, by `id` or `group/child` path) with a " +
    "partial patch, deep-merged: objects merge key by key, anything else (arrays, tracks' " +
    "keyframe lists) is replaced. id and kind never change. The result is checked against the " +
    "kind's fields; `notices` names patch keys the kind has no field for and an `id`/`kind` " +
    "that was not changed. " +
    AT_RULES +
    "It places the patched element against the scene and wins over an `x`/`y` in the patch. " +
    COORDINATES,
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
    at: AtPlacementSchema.optional(),
  }),
  output: SceneResult,
  async run({ scene, project, id, patch, at }, ctx) {
    const notices: string[] = [];
    const result = await editScene(
      await inProject(ctx, project),
      scene,
      (s) => ({
        ...s,
        elements: updateElement(s.elements, id, (el) => {
          notices.push(...patchNotices(el, patch));
          const out = patched(el, patch);
          return at ? placeAt(out, at, s) : out;
        }),
      }),
    );
    return { ...result, notices: [...notices, ...result.notices] };
  },
});
