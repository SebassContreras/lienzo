import type { CompactScene } from "../model/compact.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Scene } from "../model/model.ts";
import { cameraOutsideShot } from "../model/shots.ts";
import { expandScene } from "./compact/expand.ts";
import type { ProjectCtx } from "./ctx.ts";
import { estimatedWidthNotices, fontNotices } from "./font-check.ts";
import { withFileAspects } from "./image-aspect.ts";
import { fail, failAll, ToolFailure } from "./registry.ts";

const join = (prefix: string, path: string) =>
  path ? `${prefix}.${path}` : prefix;

import { sceneDefaults } from "./scene-defaults.ts";
import { resourceNotices } from "./scene-resources.ts";
import { animLibrary, checkWholeScene, findPreset } from "./scenes.ts";

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
      base: await sceneDefaults(ctx),
    });
    scene = checkWholeScene(
      {
        ...full.scene,
        elements: await withFileAspects(
          ctx,
          full.scene.elements,
          compact.elements ?? [],
        ),
      },
      library,
      { given: compact },
    );
    notices = [
      ...ignoredFields(full.scene, scene).map(ignoredNotice),
      ...full.notices,
      ...(scene.shots ?? []).flatMap((sh) => cameraOutsideShot(sh) ?? []),
    ];
  } catch (err: unknown) {
    // the failing path is the compact one: elements keep their index (069/D12)
    if (err instanceof ToolFailure) {
      const { code, path, message, errors } = err.error;
      failAll(
        code,
        (errors ?? [{ path, message }]).map((p) => ({
          path: join("compact", p.path),
          message: p.message,
        })),
      );
    }
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
