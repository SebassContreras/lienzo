import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { sparseScene } from "../../elements/sparse-scene.ts";
import { openScene } from "../scenes.ts";

export const sceneGet = defineTool({
  name: "scene_get",
  effects: [],
  description:
    "Get a saved scene as JSON (size, timing, background, shots, elements). Each element comes " +
    "as its `id`, `kind` and the fields that differ from its kind's defaults (component_list " +
    "has the defaults); `full: true` returns every field. Either form goes back into " +
    "scene_create or scene_validate `data` as is.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    full: z.boolean().optional(),
  }),
  output: z.record(z.string(), z.unknown()),
  async run({ scene, project, full }, ctx) {
    const stored = await openScene(await inProject(ctx, project), scene);
    return full ? stored : sparseScene(stored);
  },
});
