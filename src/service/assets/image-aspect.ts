/**
 * An image element takes its picture's own proportion (069/D14): the tools read the asset's
 * header, so a square file is not drawn at the 4:3 default.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Element } from "../../model/model.ts";
import type { ProjectCtx } from "../core/ctx.ts";
import { round2, round3 } from "../core/round.ts";
import { assetSegments, safeAssetPath } from "./asset-path.ts";
import { imageSize } from "./image-header.ts";

/** Width over height of the project asset `src`, or undefined when it cannot be read. */
async function fileAspect(
  ctx: ProjectCtx,
  src: string,
): Promise<number | undefined> {
  const path = safeAssetPath(assetSegments(src));
  if (!path) return undefined;
  const file = join(ctx.projects.resolvePath(ctx.project, "assets"), path);
  const size = await readFile(file).then(imageSize, () => undefined);
  return size && size.width > 0 && size.height > 0
    ? round3(size.width / size.height)
    : undefined;
}

/**
 * `el` with the aspect of its picture when it is an image and `given` (the input that built
 * it) sets `src` but not `aspect`; with `keepAspect`, the side `given` did not set follows.
 */
export async function withFileAspect(
  ctx: ProjectCtx,
  el: Element,
  given: Record<string, unknown>,
): Promise<Element> {
  if (el.kind !== "image" || !("src" in given) || "aspect" in given) return el;
  const aspect = await fileAspect(ctx, el.src);
  if (!aspect) return el;
  if (!el.keepAspect) return { ...el, aspect };
  return "h" in given && !("w" in given)
    ? { ...el, aspect, w: round2(el.h * aspect) }
    : { ...el, aspect, h: round2(el.w / aspect) };
}

/** `elements` with `withFileAspect` applied to each, group children by their `children` input. */
export async function withFileAspects(
  ctx: ProjectCtx,
  elements: readonly Element[],
  given: readonly unknown[],
): Promise<Element[]> {
  return Promise.all(
    elements.map(async (el, i) => {
      const input = (given[i] ?? {}) as Record<string, unknown>;
      const out = await withFileAspect(ctx, el, input);
      return out.kind === "group" && Array.isArray(input.children)
        ? {
            ...out,
            children: await withFileAspects(ctx, out.children, input.children),
          }
        : out;
    }),
  );
}
