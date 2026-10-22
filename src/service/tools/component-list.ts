import { z } from "zod";
import { trackPaths } from "../../components/descriptor.ts";
import { COMPONENTS } from "../../components/index.ts";
import { COORDINATES } from "../elements.ts";
import { defineTool } from "../registry.ts";

export const componentList = defineTool({
  name: "component_list",
  description:
    "List every component kind element_add accepts, with its Spanish label and the paths " +
    "keyframe_set can animate on it. " +
    COORDINATES,
  input: z.object({}),
  output: z.array(
    z.object({
      kind: z.string(),
      label: z.string(),
      animatable: z.array(z.string()),
    }),
  ),
  run: async () =>
    COMPONENTS.map((d) => ({
      kind: d.kind,
      label: d.label,
      animatable: trackPaths(d),
    })),
});
