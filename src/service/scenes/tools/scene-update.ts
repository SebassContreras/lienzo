import { z } from "zod";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool } from "../../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

const SETTINGS = [
  "width",
  "height",
  "duration",
  "fps",
  "mode",
  "audio",
  "audioTracks",
  "symbols",
] as const;

export const sceneUpdate = defineTool({
  name: "scene_update",
  description:
    "Change a saved scene's settings with a partial patch: width, height, duration, fps, mode, " +
    "audio, audioTracks and symbols. Objects merge key by key, anything else is replaced, and " +
    "`null` removes a key (JSON Merge Patch, RFC 7386), e.g. `{ symbols: { card: null } }` " +
    "deletes a symbol (a `use` that still names it draws nothing, and a notice says so). A " +
    "symbol's children may be partial (`{ id, kind, w, h }`): missing fields take their kind's " +
    "defaults. A bare audio `assetId` (`voz.mp3`, as asset_add returns it) is stored with its " +
    "project prefix, and a notice says when the file is missing. Elements, shots and the " +
    "background have their own tools. A `duration` " +
    "shorter than the end of a shot is rejected: move or remove the shot first (shot_set).",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    patch: z
      .object(
        Object.fromEntries(SETTINGS.map((k) => [k, z.unknown().optional()])),
      )
      .strict(),
  }),
  output: SceneResult,
  run: async ({ scene, project, patch }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) =>
      mergePatch(s, patch),
    ),
});

/** RFC 7386 JSON Merge Patch: objects merge, `null` removes, anything else replaces. */
export function mergePatch<T>(target: T, patch: Record<string, unknown>): T {
  const out = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete out[key];
    else if (isObject(value) && isObject(out[key]))
      out[key] = mergePatch(out[key], value);
    else if (value !== undefined) out[key] = structuredClone(value);
  }
  return out as T;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
