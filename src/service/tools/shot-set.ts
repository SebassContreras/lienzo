import { z } from "zod";
import type { Shot } from "../../model/model.ts";
import { ShotCameraSchema, ShotTransitionSchema } from "../../model/schema.ts";
import { deepMerge } from "../../presets/resolve.ts";
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
      const shots: Shot[] = structuredClone(s.shots ?? []);
      const index = shots.findIndex((sh) => sh.id === id);

      if (remove) {
        if (index === -1) {
          fail("not_found", `No se encontró la toma «${id}»`, "id");
        }
        shots.splice(index, 1);
        return {
          ...s,
          shots: shots.length > 0 ? shots : undefined,
        };
      }

      if (index === -1) {
        // Creating a new shot
        if (start === undefined || end === undefined) {
          fail(
            "invalid_input",
            `Para crear la toma «${id}» se requieren 'start' y 'end'`,
            "start",
          );
        }
        if (end < start) {
          fail(
            "invalid_input",
            `'end' (${end}) no puede ser menor que 'start' (${start})`,
            "end",
          );
        }
        const newShot: Shot = {
          id,
          name: name ?? id,
          start,
          end,
          transition,
          camera,
        };
        shots.push(newShot);
      } else {
        // Updating existing shot
        const existing = shots[index] as Shot;
        if (name !== undefined) existing.name = name;
        if (start !== undefined) existing.start = start;
        if (end !== undefined) existing.end = end;
        if (existing.end < existing.start) {
          fail(
            "invalid_input",
            `'end' (${existing.end}) no puede ser menor que 'start' (${existing.start})`,
            "end",
          );
        }
        if (transition !== undefined) {
          existing.transition = transition;
        }
        if (camera !== undefined) {
          if (existing.camera) {
            deepMerge(
              existing.camera as unknown as Record<string, unknown>,
              camera as unknown as Record<string, unknown>,
            );
          } else {
            existing.camera = camera;
          }
        }
      }

      // Sort shots in ascending chronological order by start time
      shots.sort((a, b) => a.start - b.start);

      return {
        ...s,
        shots,
      };
    });
  },
});
