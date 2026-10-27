import { z } from "zod";
import { SHOT_RULES } from "../../engine/shots.ts";
import {
  ANIM_RULES,
  AT_RULES,
  CompactSceneSchema,
} from "../../model/compact.ts";
import { parseScene, SceneSchema } from "../../model/schema.ts";
import { slugify } from "../../presets/slug.ts";
import { buildCompact } from "../build-compact.ts";
import { FLAT_KINDS } from "../compact/defaults.ts";
import { keepAudio } from "../compact/keep-audio.ts";
import { availableFonts, measureInstalledFonts } from "../font-install.ts";
import { storedAsNotice } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { saveScene } from "../scenes.ts";

export const sceneBuild = defineTool({
  name: "scene_build",
  description:
    "Build a full scene from a compact description given in `compact` (size, elements, " +
    "shots… go inside it, not at the top level), over the project's canvas (size, " +
    'duration, fps, palette background) for what it leaves out. `size` is "WxH", [w, h], a ' +
    'ratio ("9:16", "4:5", "1:1", "16:9") or a format ("Story"); anything else fails. ' +
    "Expands background (a background " +
    "preset name, a color such as `#111827` for a solid background, or an object such as " +
    "`{ color, dots: true }` that starts solid and turns on only what it names), " +
    "presets, shortcuts (at, fit, from, to, short tracks and anim), partial `effects`, and validates " +
    'the resulting scene. `defaults: "flat"` turns off the default gradient, shadow, border and ' +
    `border glow of ${FLAT_KINDS.join(", ")} unless the element sets them; it is applied ` +
    "at build time, not stored. " +
    AT_RULES +
    "A top-level element with no `at`, `x`, `y` or `fit` is centred, as in element_add. " +
    "`from`/`to` are a line's target ids, and a counter's own start and end values. " +
    ANIM_RULES +
    "A `shot`, icon or line target that does not exist fails, listing the valid ones. " +
    "`notices` lists what was ignored (e.g. unknown effect keys). " +
    'Shape options: `fit: "box"` stretches a polygon to fill its box (a `sides: 3` roof ' +
    "touches the bottom); `clip: true` (and `radius`) on a group clips its children without a " +
    'frame; `fill.type: "radial"` and `fill.stops: [{at, color}, …]` (at 0–1, 2+ stops, in ' +
    "order) give radial and multi-stop gradients when `fill.gradient` is on. " +
    "`audioTracks: [{assetId, startOffset?, volume?, …}]` sets the scene's audio tracks. " +
    "If `save` is provided, the scene is saved under that name (returned in `saved`; every notice, build and save, is in `notices`) " +
    'and, unless `response_format: "detailed"`, only the `id` and `kind` of each top-level element come back instead of the scene (scene_get reads it); fails if the name exists unless `overwrite` is true. ' +
    "Overwriting keeps the stored scene's audio (with a notice) unless `audioTracks` is given (`[]` clears it). " +
    "A notice also names any text or subtitles font that is not installed (run font_install). " +
    SHOT_RULES,
  input: z.object({
    compact: CompactSceneSchema,
    project: PROJECT,
    save: z.string().optional(),
    overwrite: z.boolean().optional(),
    response_format: z.enum(["concise", "detailed"]).optional(),
  }),
  output: z.object({
    scene: SceneSchema.optional(),
    elements: z
      .array(z.object({ id: z.string(), kind: z.string() }))
      .optional(),
    saved: z.string().optional(),
    notices: z.array(z.string()),
  }),
  async run({ compact, project, save, overwrite, response_format }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    const fonts = await availableFonts(ctx.fonts, project);
    await measureInstalledFonts(ctx.fonts, project);
    const built = await buildCompact(
      effectiveCtx,
      compact,
      fonts.map((f) => f.family),
      { resources: !save },
    );
    let expanded = built.scene;
    const notices = built.notices;

    let saved: string | undefined;
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
      const result = await saveScene(effectiveCtx, save, expanded);
      saved = result.scene;
      notices.push(...storedAsNotice(save, saved));
      notices.push(...result.notices);
    }

    // Concise by default once saved (064/D5): scene_get gives the full scene
    if (saved && response_format !== "detailed") {
      const elements = expanded.elements.map(({ id, kind }) => ({ id, kind }));
      return { saved, elements, notices };
    }
    return { scene: expanded, saved, notices };
  },
});
