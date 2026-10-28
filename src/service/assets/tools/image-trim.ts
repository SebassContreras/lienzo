import { z } from "zod";
import { findElement, updateElement } from "../../elements/element-tree.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool } from "../../registry.ts";
import { openScene, SceneResult, saveScene } from "../../scenes/scenes.ts";
import { trimImage } from "../image-trim.ts";

export const imageTrim = defineTool({
  name: "image_trim",
  description:
    "Crop an image element (at root or inside nested groups, by `id` or `group/child` path) to " +
    "its visible pixels, removing the transparent margin of the picture. The asset file is not " +
    "changed: the element's `crop` is set and its box shrinks so the visible content keeps its " +
    "place and scale on the canvas. Fails on `id` when it is not an image, cannot be decoded or " +
    "is fully transparent.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
  }),
  output: SceneResult,
  async run({ scene, project, id }, ctx) {
    const pctx = await inProject(ctx, project);
    const s = await openScene(pctx, scene);
    const el = findElement(s.elements, id);
    const trimmed = await trimImage(pctx, el);
    return saveScene(
      pctx,
      scene,
      {
        ...s,
        elements: updateElement(s.elements, id, () => trimmed),
      },
      s,
    );
  },
});
