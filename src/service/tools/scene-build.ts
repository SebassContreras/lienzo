import { z } from "zod";
import { CompactSceneSchema } from "../../model/compact.ts";
import { ignoredNotice, ignoredPaths } from "../../model/ignored.ts";
import { parseScene, SceneSchema } from "../../model/schema.ts";
import { slugify } from "../../presets/slug.ts";
import { expandScene } from "../compact/expand.ts";
import { keepAudio } from "../compact/keep-audio.ts";
import { fontNotices } from "../font-check.ts";
import { availableFonts } from "../font-install.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { checkScene, findPreset, SceneResult, saveScene } from "../scenes.ts";

export const sceneBuild = defineTool({
  name: "scene_build",
  description:
    "Build a full scene from a compact description. Expands size, background, " +
    "presets, shortcuts (at, fit, from, to, short tracks and anim), partial `effects`, and validates " +
    'the resulting scene. `defaults: "flat"` turns off the default gradient, shadow and border ' +
    "of shapes (rect, ellipse, polygon, star, arrow) unless the element sets them; it is applied " +
    "at build time, not stored. `notices` lists what was ignored (e.g. unknown effect keys). " +
    'Shape options: `fit: "box"` stretches a polygon to fill its box (a `sides: 3` roof ' +
    "touches the bottom); `clip: true` (and `radius`) on a group clips its children without a " +
    'frame; `fill.type: "radial"` and `fill.stops: [{at, color}, …]` (at 0–1, 2+ stops, in ' +
    "order) give radial and multi-stop gradients when `fill.gradient` is on. " +
    "`audioTracks: [{assetId, startOffset?, volume?, …}]` sets the scene's audio tracks. " +
    "If `save` is provided, the scene is saved under that name; fails if the name exists unless `overwrite` is true. " +
    "Overwriting keeps the stored scene's audio (with a notice) unless `audioTracks` is given (`[]` clears it). " +
    "A notice also names any text or subtitles font that is not installed (run font_install).",
  input: z.object({
    compact: CompactSceneSchema,
    project: PROJECT,
    save: z.string().optional(),
    overwrite: z.boolean().optional(),
  }),
  output: z.object({
    scene: SceneSchema,
    saved: SceneResult.optional(),
    notices: z.array(z.string()),
  }),
  async run({ compact, project, save, overwrite }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    let expanded: ReturnType<typeof checkScene>;
    let notices: string[];
    try {
      const full = await expandScene(compact, {
        findPreset: async (name) => {
          try {
            const found = await findPreset(effectiveCtx, name);
            return found.recipe;
          } catch {
            return undefined;
          }
        },
        animLibrary: await (async () => {
          const { animLibrary } = await import("../scenes.ts");
          return animLibrary(effectiveCtx);
        })(),
      });
      expanded = checkScene(full.scene);
      notices = [
        ...ignoredPaths(full.scene, expanded).map(ignoredNotice),
        ...full.notices,
      ];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fail("invalid_compact_scene", msg, "compact");
    }

    const fonts = await availableFonts(ctx.fonts, project);
    notices.push(
      ...fontNotices(
        expanded,
        fonts.map((f) => f.family),
      ),
    );

    let saved: z.infer<typeof SceneResult> | undefined;
    if (save) {
      const stored = await effectiveCtx.store.readScene(save);
      if (!overwrite && stored !== undefined) {
        fail("exists", `Ya existe la escena «${slugify(save)}»`, "save");
      }
      const previous = stored === undefined ? undefined : parseScene(stored);
      const kept = keepAudio(
        expanded,
        previous?.ok ? previous.value : undefined,
        compact,
      );
      expanded = kept.scene;
      if (kept.notice) notices.push(kept.notice);
      saved = await saveScene(effectiveCtx, save, expanded);
    }

    return {
      scene: expanded,
      saved,
      notices,
    };
  },
});
