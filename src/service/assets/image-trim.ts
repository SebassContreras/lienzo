import { applyCrop } from "../../engine/image-trim.ts";
import type { Element, ImageEl } from "../../model/model.ts";
import type { ProjectCtx } from "../core/ctx.ts";
import { fail } from "../core/registry.ts";
import { round3 } from "../core/round.ts";
import { assetSegments, projectAssetUrl, safeAssetPath } from "./asset-path.ts";

/** Where the page loads `src` from: a project asset through its route, anything else as is. */
function imageUrl(project: string, src: string): string {
  const path = safeAssetPath(assetSegments(src));
  return path ? projectAssetUrl(project, path) : src;
}

/**
 * `el` trimmed to its visible pixels (049/D3), the step `image_trim` and `element_add` share.
 * Fails on `path` for a non-image, an image that cannot be decoded or one with no visible
 * pixel, before anything is saved.
 */
export async function trimImage(
  ctx: ProjectCtx,
  el: Element,
  path = "id",
): Promise<ImageEl> {
  if (el.kind !== "image")
    fail("invalid_input", `«${el.id}» no es una imagen`, path);
  if (!el.src) fail("image_unreadable", `«${el.id}» no tiene imagen`, path);
  const bounds = await ctx.images
    .opaqueBounds(imageUrl(ctx.project, el.src))
    .catch(() =>
      fail("image_unreadable", `No se pudo leer la imagen ${el.src}`, path),
    );
  if (!bounds)
    fail("image_empty", `La imagen ${el.src} es transparente del todo`, path);
  const out = applyCrop(el, bounds);
  return { ...out, aspect: round3(out.aspect) };
}
