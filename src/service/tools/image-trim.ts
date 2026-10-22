import { z } from "zod";
import type { Element } from "../../model/model.ts";
import { trimImage } from "../image-trim.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { elementIndex, openScene, SceneResult, saveScene } from "../scenes.ts";

export const imageTrim = defineTool({
  name: "image_trim",
  description:
    "Crop an image element to its visible pixels, removing the transparent margin of the " +
    "picture. The asset file is not changed: the element's `crop` is set and its box shrinks " +
    "so the visible content keeps its place and scale on the canvas. Fails on `id` when it " +
    "is not an image, cannot be decoded or is fully transparent.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
  }),
  output: SceneResult,
  async run({ scene, project, id }, ctx) {
    const pctx = await inProject(ctx, project);
    const s = await openScene(pctx, scene);
    const i = elementIndex(s, id);
    const trimmed = await trimImage(pctx, s.elements[i] as Element);
    return saveScene(pctx, scene, {
      ...s,
      elements: s.elements.map((el, j) => (j === i ? trimmed : el)),
    });
  },
});
