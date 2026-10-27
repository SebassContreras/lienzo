import type { CompactScene } from "../model/compact.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Scene } from "../model/model.ts";
import { expandScene } from "./compact/expand.ts";
import type { ProjectCtx } from "./ctx.ts";
import { estimatedWidthNotices, fontNotices } from "./font-check.ts";
import { fail } from "./registry.ts";
import { resourceNotices } from "./scene-resources.ts";
import { animLibrary, checkScene, findPreset } from "./scenes.ts";

/**
 * Expands and checks a compact scene, with every notice `scene_build` gives (064/D11):
 * ignored paths, what the expansion skipped, missing fonts and estimated widths.
 */
export async function buildCompact(
  ctx: ProjectCtx,
  compact: CompactScene,
  fonts: readonly string[],
): Promise<{ scene: Scene; notices: string[] }> {
  let scene: Scene;
  let notices: string[];
  try {
    const full = await expandScene(compact, {
      findPreset: async (name) => {
        try {
          return (await findPreset(ctx, name)).recipe;
        } catch {
          return undefined;
        }
      },
      animLibrary: await animLibrary(ctx),
    });
    scene = checkScene(full.scene);
    notices = [
      ...ignoredFields(full.scene, scene).map(ignoredNotice),
      ...full.notices,
    ];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail("invalid_compact_scene", msg, "compact");
  }
  notices.push(
    ...fontNotices(scene, fonts),
    ...estimatedWidthNotices(scene),
    ...(await resourceNotices(ctx, scene)),
  );
  return { scene, notices };
}
