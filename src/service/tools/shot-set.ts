import { z } from "zod";
import { shotNotices } from "../scene-notices.ts";
import { SHOT_RULES } from "../../engine/shots.ts";
import { CompactShotCameraSchema } from "../../model/compact.ts";
import { ShotTransitionSchema } from "../../model/schema.ts";
import { movedNotice } from "../../model/shot-timing.ts";
import {
  cameraOutsideShot,
  removeShotIn,
  type SceneShotsResult,
  setShotIn,
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
    "configure cut pacing and camera movement; camera `tracks` take the short form scene_build takes " +
    "(`{ zoom: [[3, 1], [6, 1.2, 'ease-out']] }`, easing optional) and their `t` is scene time, " +
    "not time within the shot (a notice names keys outside the shot). A shot must end within the scene and not " +
    "overlap another. Moving a shot (`start` and `end` shifted by the same amount) moves its " +
    "camera keys and the tracks of the elements bound to it with it (an element's tracks are " +
    "timed from its shot's start; a notice lists them); trimming one edge or changing the " +
    "length leaves them where they are. Removing a shot unbinds the elements bound to it (listed in " +
    "`notices`) and moves their tracks back to the scene's start, " +
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

    let edit: Exclude<SceneShotsResult, { error: unknown }> | undefined;
    const result = await editScene(projectCtx, scene, (s) => {
      const out = remove
        ? removeShotIn(s, id)
        : setShotIn(s, {
            id,
            name,
            start,
            end,
            transition,
            camera,
          });
      if ("error" in out)
        fail(out.error.code, out.error.message, out.error.path);
      edit = out;
      return out.scene;
    });
    const unbound = edit?.unbound ?? [];
    const shot = remove
      ? undefined
      : edit?.scene.shots?.find((sh) => sh.id === id);
    const outside = shot && cameraOutsideShot(shot);
    if (outside) result.notices.push(outside);
    if (shot && edit)
      result.notices.push(
        ...shotNotices({ ...edit.scene, shots: [shot] }).map((n) => n.message),
      );
    const moved = movedNotice(edit?.moved ?? []);
    if (moved) result.notices.push(moved);
    if (unbound.length > 0)
      result.notices.push(
        `Ya no están ligados a la toma «${id}» y se ven en toda la escena: ${unbound.join(", ")}`,
      );
    return result;
  },
});
