import type { CompactScene } from "../model/compact.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Scene } from "../model/model.ts";
import { expandScene } from "./compact/expand.ts";
import type { ProjectCtx } from "./ctx.ts";
import { estimatedWidthNotices, fontNotices } from "./font-check.ts";
import { withFileAspects } from "./image-aspect.ts";
import { fail, ToolFailure } from "./registry.ts";

const join = (prefix: string, path: string) =>
  path ? `${prefix}.${path}` : prefix;

import { resourceNotices } from "./scene-resources.ts";
import {
  animLibrary,
  checkAnimPresets,
  checkScene,
  findPreset,
} from "./scenes.ts";

/**
 * Expands and checks a compact scene, with every notice `scene_build` gives (064/D11):
 * ignored paths, what the expansion skipped, missing fonts and estimated widths.
 */
export async function buildCompact(
  ctx: ProjectCtx,
  compact: CompactScene,
  fonts: readonly string[],
  { resources = true } = {},
): Promise<{ scene: Scene; notices: string[] }> {
  let scene: Scene;
  let notices: string[];
  const library = await animLibrary(ctx);
  try {
    const full = await expandScene(compact, {
      findPreset: async (name) => {
        try {
          return (await findPreset(ctx, name)).recipe;
        } catch {
          return undefined;
        }
      },
      animLibrary: library,
    });
    scene = checkScene({
      ...full.scene,
      elements: await withFileAspects(
        ctx,
        full.scene.elements,
        compact.elements ?? [],
      ),
    });
    checkAnimPresets(scene, library);
    notices = [
      ...ignoredFields(full.scene, scene).map(ignoredNotice),
      ...full.notices,
    ];
  } catch (err: unknown) {
    // the failing path is the compact one: elements keep their index (069/D12)
    if (err instanceof ToolFailure)
      fail(
        "invalid_compact_scene",
        err.error.message,
        join("compact", err.error.path),
      );
    const msg = err instanceof Error ? err.message : String(err);
    const path = /^([\w.]+): /.exec(msg)?.[1] ?? "";
    fail("invalid_compact_scene", msg, join("compact", path));
  }
  notices.push(
    ...fontNotices(scene, fonts),
    ...estimatedWidthNotices(scene),
    // a build that is then saved leaves these to the save (070/D3)
    ...(resources ? await resourceNotices(ctx, scene) : []),
  );
  return { scene, notices };
}
