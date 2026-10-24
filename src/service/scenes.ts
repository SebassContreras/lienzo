/**
 * Reading and writing scenes for the tools (007/D4, D6): nothing reaches disk unless it
 * parses as an editor scene, with its animation presets copied in first.
 */
import { z } from "zod";
import { type AnimPreset, parseAnimPreset } from "../model/anim-preset.ts";
import type { Element, Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { parseScene } from "../model/schema.ts";
import { expandAnimPresets } from "../presets/anim-presets.ts";
import { slugify } from "../presets/slug.ts";
import { asRecipe } from "../presets/store.ts";
import type { Ctx, ProjectCtx } from "./ctx.ts";
import { fail } from "./registry.ts";
import type { PresetSource } from "./store.ts";

/** `data` as a scene, or a failure naming the first failing path under `prefix`. */
export function checkScene(data: unknown, prefix = ""): Scene {
  const parsed = parseScene(data);
  if (parsed.ok) return parsed.value;
  const path = [prefix, parsed.path].filter(Boolean).join(".");
  return fail("invalid_scene", parsed.error, path);
}

/** The stored scene `name`, checked. */
export async function openScene(ctx: ProjectCtx, name: string): Promise<Scene> {
  const data = await ctx.store.readScene(name);
  if (data === undefined)
    fail("not_found", `No existe la escena «${name}»`, "scene");
  return checkScene(data);
}

/** The animation presets in the library that pass the schema. */
export async function animLibrary(ctx: Ctx): Promise<AnimPreset[]> {
  return (await ctx.store.animPresets()).flatMap((item) => {
    const parsed = parseAnimPreset(item.data);
    return parsed.ok ? [parsed.value] : [];
  });
}

/** The path of the first element (group children included) naming a preset not in `names`. */
function unknownPreset(
  elements: readonly Element[],
  names: ReadonlySet<string>,
  prefix: string,
): string | undefined {
  for (const [i, el] of elements.entries()) {
    const at = `${prefix}${i}`;
    if (el.animPreset && !names.has(el.animPreset.name))
      return `${at}.animPreset`;
    if (el.kind === "group") {
      const inner = unknownPreset(el.children, names, `${at}.children.`);
      if (inner) return inner;
    }
  }
  return undefined;
}

/**
 * `data` checked as a scene with its `animPreset` names expanded into copied values
 * (019/D10); an unknown name fails. `notices` lists what a preset could not apply.
 */
export async function prepareScene(
  ctx: Ctx,
  data: unknown,
): Promise<{ scene: Scene; notices: string[] }> {
  const scene = checkScene(data);
  const library = await animLibrary(ctx);
  const missing = unknownPreset(
    scene.elements,
    new Set(library.map((p) => p.name)),
    "elements.",
  );
  if (missing)
    fail(
      "unknown_anim_preset",
      "No existe esa animación en la biblioteca",
      missing,
    );
  const expanded = expandAnimPresets(scene, library);
  return { scene: checkScene(expanded.scene), notices: expanded.notices };
}

/** What a tool that writes a scene answers: the file it wrote and what a preset skipped. */
export const SceneResult = z.object({
  scene: z.string(),
  notices: z.array(z.string()),
});

export type SceneResult = z.infer<typeof SceneResult>;

/** Writes `data` as scene `name` once it is valid; nothing is written otherwise (R4). */
export async function saveScene(
  ctx: ProjectCtx,
  name: string,
  data: unknown,
): Promise<SceneResult> {
  const { scene, notices } = await prepareScene(ctx, data);
  return { scene: await ctx.store.writeScene(name, scene), notices };
}

/** Opens scene `name`, applies `edit` (pure) and saves the result under the same name. */
export async function editScene(
  ctx: ProjectCtx,
  name: string,
  edit: (scene: Scene) => Scene,
): Promise<SceneResult> {
  return saveScene(ctx, name, edit(await openScene(ctx, name)));
}

export type FoundPreset = {
  recipe: PresetRecipe;
  source: PresetSource;
  file: string;
};

/** The preset whose name or file name is `name` (user presets before built-ins of the same name). */
export async function findPreset(ctx: Ctx, name: string): Promise<FoundPreset> {
  const all = (await ctx.store.presets()).map((p) => ({
    ...p,
    recipe: asRecipe(p.data as PresetRecipe),
  }));
  const match = all
    .reverse()
    .find((p) => p.recipe.name === name || p.file === slugify(name));
  if (!match) fail("not_found", `No existe el preset «${name}»`, "preset");
  return { recipe: match.recipe, source: match.source, file: match.file };
}
