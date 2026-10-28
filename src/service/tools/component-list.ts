import { z } from "zod";
import { trackPaths } from "../../components/descriptor.ts";
import { COMPONENTS } from "../../components/index.ts";
import { OPTIONS_TEXT } from "../../model/options.ts";
import { COORDINATES } from "../elements.ts";
import { defineTool } from "../registry.ts";

/** Defaults a newcomer trips on, told with the kind (069/D14). */
const NOTES: Record<string, string> = {
  counter:
    "element_add and scene_build give a new counter a `progress` track from 0 to 1 over the " +
    "first 1.5 s of its shot (or of the scene; less if the shot or scene is shorter), so it " +
    "counts up while it is seen; the track is written once, when it is added; a `progress` value or track of " +
    "your own replaces it (compact: `tracks: { progress: [[0, 0], [2, 1]] }`). A counter " +
    "preset's own track starts at its shot's `start` too. In compact, `from`/`to` are its " +
    "start and end values.",
  icon:
    "`icon` is a lucide name (lucide.dev/icons), in any case or kebab-case (`star`, " +
    "`arrow-right` are stored as `Star`, `ArrowRight`); an unknown name fails, naming the closest one when one is close and " +
    "otherwise examples (names are lucide's, in English: `star`, not `estrella`). The rounded " +
    "tile behind it is on by default (`tile.enabled: false` hides it).",
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
    COORDINATES +
    OPTIONS_TEXT,
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
