import { z } from "zod";
import { trackPaths } from "../../components/descriptor.ts";
import { COMPONENTS } from "../../components/index.ts";
import { COORDINATES } from "../elements.ts";
import { defineTool } from "../registry.ts";

/** Defaults a newcomer trips on, told with the kind (069/D14). */
const NOTES: Record<string, string> = {
  counter:
    "Shows its final value (`to`) because `progress` defaults to 1; to count up, keyframe " +
    "`progress` from 0 to 1 (compact: `tracks: { progress: [[0, 0], [2, 1]] }`).",
  image:
    "Given a project asset `src` and no `aspect`, element_add and scene_build read the " +
    "picture's own proportion and size `h` (or `w`) to it.",
  list: '`items` is one item per line (`"a\\nb"`); compact also takes an array of strings.',
};

export const componentList = defineTool({
  name: "component_list",
  description:
    "List every component kind element_add accepts, with its Spanish label and the paths " +
    "keyframe_set can animate on it, and a `note` on defaults worth knowing. " +
    COORDINATES,
  input: z.object({}),
  output: z.array(
    z.object({
      kind: z.string(),
      label: z.string(),
      animatable: z.array(z.string()),
      note: z.string().optional(),
    }),
  ),
  run: async () =>
    COMPONENTS.map((d) => ({
      kind: d.kind,
      label: d.label,
      animatable: trackPaths(d),
      ...(NOTES[d.kind] ? { note: NOTES[d.kind] } : {}),
    })),
});
