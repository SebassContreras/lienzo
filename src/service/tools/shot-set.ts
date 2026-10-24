import { z } from "zod";
import { ShotCameraSchema, ShotTransitionSchema } from "../../model/schema.ts";
import { removeShot, setShot } from "../../model/shots.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const shotSet = defineTool({
  name: "shot_set",
  description:
    "Create, update, or remove a shot in a scene. Specify `id`, `start`, and `end` " +
    "to create or update a shot; pass `remove: true` to delete it. Optional `name`, `transition` " +
    "({ kind: 'cut'|'fade'|'slide'|'zoom', duration: number }), and `camera` ({ x, y, zoom, tracks }) " +
    "configure cut pacing and camera movement.",
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

    return editScene(projectCtx, scene, (s) => {
      const result = remove
        ? removeShot(s.shots ?? [], id)
        : setShot(s.shots ?? [], { id, name, start, end, transition, camera });
      if ("error" in result) {
        const { code, message, path } = result.error;
        fail(code, message, path);
      }
      return {
        ...s,
        shots: result.shots.length > 0 ? result.shots : undefined,
      };
    });
  },
});
