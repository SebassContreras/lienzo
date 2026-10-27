import { z } from "zod";
import { SHOT_RULES } from "../../engine/shots.ts";
import { CompactShotCameraSchema } from "../../model/compact.ts";
import type { Shot } from "../../model/model.ts";
import { ShotTransitionSchema } from "../../model/schema.ts";
import {
  cameraOutsideShot,
  removeShot,
  setShot,
  shotProblem,
  unbindShot,
} from "../../model/shots.ts";
import { normalizeCamera } from "../compact/tracks.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const shotSet = defineTool({
  name: "shot_set",
  description:
    "Create, update, or remove a shot in a scene. Specify `id`, `start`, and `end` " +
    "to create or update a shot; pass `remove: true` to delete it. Optional `name`, `transition` " +
    "({ kind: 'cut'|'fade'|'slide'|'zoom', duration: number }), and `camera` ({ x, y, zoom, tracks }) " +
    "configure cut pacing and camera movement; camera `tracks` take the short form scene_build takes " +
    "(`{ zoom: [[3, 1], [6, 1.2, 'ease-out']] }`, easing optional) and their `t` is scene time, " +
    "not time within the shot (a notice names keys outside the shot). A shot must end within the scene and not " +
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
    camera: CompactShotCameraSchema.optional(),
    remove: z.boolean().optional(),
  }),
  output: SceneResult,
  async run(
    { scene, project, id, name, start, end, transition, camera, remove },
    ctx,
  ) {
    const projectCtx = await inProject(ctx, project);

    let unbound: string[] = [];
    let saved: Shot[] | undefined;
    const result = await editScene(projectCtx, scene, (s) => {
      const result = remove
        ? removeShot(s.shots ?? [], id)
        : setShot(s.shots ?? [], {
            id,
            name,
            start,
            end,
            transition,
            camera: camera && normalizeCamera(camera),
          });
      const error =
        "error" in result
          ? result.error
          : shotProblem(result.shots, s.duration);
      if (error) fail(error.code, error.message, error.path);
      const shots = (result as { shots: Shot[] }).shots;
      saved = shots;
      const elements = remove ? unbindShot(s.elements, id) : undefined;
      unbound = elements?.unbound ?? [];
      return {
        ...s,
        elements: elements?.elements ?? s.elements,
        shots: shots.length > 0 ? shots : undefined,
      };
    });
    const shot = remove ? undefined : saved?.find((sh) => sh.id === id);
    const outside = shot && cameraOutsideShot(shot);
    if (outside) result.notices.push(outside);
    if (unbound.length > 0)
      result.notices.push(
        `Ya no están ligados a la toma «${id}» y se ven en toda la escena: ${unbound.join(", ")}`,
      );
    return result;
  },
});
