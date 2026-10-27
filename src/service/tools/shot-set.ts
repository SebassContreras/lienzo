import { z } from "zod";
import { SHOT_RULES } from "../../engine/shots.ts";
import type { Shot } from "../../model/model.ts";
import { ShotCameraSchema, ShotTransitionSchema } from "../../model/schema.ts";
import {
  removeShot,
  setShot,
  shotProblem,
  unbindShot,
} from "../../model/shots.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const shotSet = defineTool({
  name: "shot_set",
  description:
    "Create, update, or remove a shot in a scene. Specify `id`, `start`, and `end` " +
    "to create or update a shot; pass `remove: true` to delete it. Optional `name`, `transition` " +
    "({ kind: 'cut'|'fade'|'slide'|'zoom', duration: number }), and `camera` ({ x, y, zoom, tracks }) " +
    "configure cut pacing and camera movement. A shot must end within the scene and not " +
    "overlap another. Removing a shot unbinds the elements bound to it (listed in `notices`), " +
    "so they show for the whole scene. " +
    SHOT_RULES,
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    name: z.string().optional(),
    start: z.number().min(0).optional(),
    end: z.number().min(0).optional(),
    transition: ShotTransitionSchema.optional(),
    camera: ShotCameraSchema.optional(),
    remove: z.boolean().optional(),
  }),
  output: SceneResult,
  async run(
    { scene, project, id, name, start, end, transition, camera, remove },
    ctx,
  ) {
    const projectCtx = await inProject(ctx, project);

    let unbound: string[] = [];
    const result = await editScene(projectCtx, scene, (s) => {
      const result = remove
        ? removeShot(s.shots ?? [], id)
        : setShot(s.shots ?? [], { id, name, start, end, transition, camera });
      const error =
        "error" in result
          ? result.error
          : shotProblem(result.shots, s.duration);
      if (error) fail(error.code, error.message, error.path);
      const shots = (result as { shots: Shot[] }).shots;
      const elements = remove ? unbindShot(s.elements, id) : undefined;
      unbound = elements?.unbound ?? [];
      return {
        ...s,
        elements: elements?.elements ?? s.elements,
        shots: shots.length > 0 ? shots : undefined,
      };
    });
    if (unbound.length > 0)
      result.notices.push(
        `Ya no están ligados a la toma «${id}» y se ven en toda la escena: ${unbound.join(", ")}`,
      );
    return result;
  },
});
