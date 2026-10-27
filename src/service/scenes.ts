/**
 * Reading and writing scenes for the tools (007/D4, D6): nothing reaches disk unless it
 * parses as an editor scene, with its animation presets copied in first.
 */
import { z } from "zod";
import { type AnimPreset, parseAnimPreset } from "../model/anim-preset.ts";
import { mapElementsDeep } from "../model/element-walk.ts";
import { withElementDefaults } from "../model/fill-defaults.ts";
import { idPath } from "../model/id-path.ts";
import { namesHint } from "../model/ignored.ts";
import type { Element, Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { parseScene, ShotSchema } from "../model/schema.ts";
import { shotProblems } from "../model/shots.ts";
import { expandAnimPresets } from "../presets/anim-presets.ts";
import { slugify } from "../presets/slug.ts";
import { asRecipe } from "../presets/store.ts";
import { withCanonicalAssets, withCanonicalAudio } from "./asset-refs.ts";
import type { Ctx, ProjectCtx } from "./ctx.ts";
import { fail, failAll, type Problem, problemsOf } from "./registry.ts";
import { checkReferences, withCanonicalIcons } from "./scene-references.ts";
import { resourceNotices } from "./scene-resources.ts";
import type { PresetSource } from "./store.ts";

const under = (prefix: string, path: string) =>
  [prefix, path].filter(Boolean).join(".");

/**
 * `data` as a scene, or a failure listing every failing path under `prefix`, elements named
 * as `given` (the caller's input) names them.
 */
export function checkScene(data: unknown, prefix = "", given = data): Scene {
  const parsed = parseScene(data);
  if (parsed.ok) return parsed.value;
  return failAll(
    "invalid_scene",
    parsed.issues.map((i) => ({
      path: under(prefix, idPath(given, i.path)),
      message: i.message,
    })),
  );
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * What the rules can read of `data` when it does not parse (075/D3): the elements as given
 * (anything not an object as an empty one, so indices hold), the shots only if they parse.
 * The rules read only ids, kinds, `shot`, `icon`, line `attach`, `animPreset.name` and
 * `children`, and check each before use.
 */
function rulesView(data: unknown): Scene {
  const raw = isObject(data) ? data : {};
  const shots = z.array(ShotSchema).safeParse(raw.shots ?? []);
  return {
    ...raw,
    elements: (Array.isArray(raw.elements) ? raw.elements : []).map((el) =>
      isObject(el) ? el : {},
    ),
    shots: shots.success ? shots.data : [],
    duration:
      typeof raw.duration === "number"
        ? raw.duration
        : Number.POSITIVE_INFINITY,
  } as unknown as Scene;
}

/**
 * The rule problems of `data` that does not parse as a scene (075/D3), read from its raw
 * elements; `buildCompact` uses it for a compact scene whose elements fail (080/D5).
 */
export function rawRuleProblems(
  data: unknown,
  library: readonly AnimPreset[],
): Problem[] {
  return ruleFailures(rulesView(data), library).flatMap((r) => r.problems);
}

/** Every rule `scene` breaks (074/D9): animation presets, shots, dangling references. */
function ruleFailures(
  scene: Scene,
  library: readonly AnimPreset[],
  previous?: Scene,
): { code: string; problems: Problem[] }[] {
  return [
    () => checkAnimPresets(scene, library),
    () => checkShots(scene),
    () => checkReferences(scene, previous),
  ].flatMap((check) => problemsOf(check) ?? []);
}

/**
 * `data` as a scene with its icon names canonical, or a failure listing every schema problem
 * and every rule it breaks together (075/R4): rules run on what parses when the rest does not.
 * Paths name elements as `given` (the caller's input) names them, under `prefix`.
 */
export function checkWholeScene(
  data: unknown,
  library: readonly AnimPreset[],
  {
    previous,
    given = data,
    prefix = "",
  }: { previous?: Scene; given?: unknown; prefix?: string } = {},
): Scene {
  const parsed = parseScene(data);
  const scene = parsed.ok ? withCanonicalIcons(parsed.value) : rulesView(data);
  const named = (path: string) => under(prefix, idPath(given, path));
  const schema = parsed.ok
    ? []
    : parsed.issues.map((i) => ({ path: named(i.path), message: i.message }));
  const rules = ruleFailures(scene, library, previous);
  const problems = [
    ...schema,
    ...rules.flatMap((r) =>
      r.problems.map((p) => ({ ...p, path: named(p.path) })),
    ),
  ];
  if (problems.length > 0)
    failAll(
      schema.length > 0 ? "invalid_scene" : (rules[0]?.code ?? ""),
      problems,
    );
  return scene;
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

/** Every element (group children included) naming a preset not in `names`, with its path. */
function unknownPresets(
  elements: readonly Element[],
  names: ReadonlySet<string>,
  prefix: string,
): { path: string; el: Element }[] {
  return elements.flatMap((el, i) => {
    const at = `${prefix}${i}`;
    const own =
      typeof el.animPreset?.name === "string" && !names.has(el.animPreset.name)
        ? [{ path: `${at}.animPreset`, el }]
        : [];
    const inner =
      el.kind === "group" && Array.isArray(el.children)
        ? unknownPresets(el.children, names, `${at}.children.`)
        : [];
    return [...own, ...inner];
  });
}

/**
 * Fails on every element naming an animation preset not in `library` (019/D10, 069/D12),
 * each with the library's names, closest first (080/D5, D7).
 */
export function checkAnimPresets(
  scene: Scene,
  library: readonly AnimPreset[],
): void {
  const names = library.map((p) => p.name);
  const missing = unknownPresets(scene.elements, new Set(names), "elements.");
  if (missing.length > 0)
    failAll(
      "unknown_anim_preset",
      missing.map(({ path, el }) => {
        const name = String(el.animPreset?.name);
        return {
          path,
          message: `«${el.id}» usa la animación «${name}», que no está en la biblioteca${namesHint(name, names, "animation_list")}`,
        };
      }),
    );
}

/**
 * Fails when a shot ends after the scene or two shots overlap (072/D4): every scene write,
 * `scene_update` shortening the scene included, and `scene_validate` apply the rule `shot_set`
 * does. Opening a stored scene does not, so a broken one can still be read and fixed.
 */
export function checkShots(scene: Scene): void {
  const problems = shotProblems(scene.shots ?? [], scene.duration);
  if (problems.length > 0)
    failAll(
      problems[0]?.code ?? "invalid_input",
      problems.map(({ message }) => ({ path: "shots", message })),
    );
}

/**
 * `data` checked as a scene with its `animPreset` names expanded into copied values
 * (019/D10), partial elements filled from their kind (080/D2); an unknown name fails, and so
 * does a reference a changed element leaves dangling (074/D1). `notices` lists what a preset
 * could not apply.
 */
export async function prepareScene(
  ctx: Ctx,
  data: unknown,
  previous?: Scene,
  given: unknown = data,
): Promise<{ scene: Scene; notices: string[] }> {
  const library = await animLibrary(ctx);
  // every write takes partial elements, filled from their kind (080/D2)
  const scene = checkWholeScene(withElementDefaults(data), library, {
    previous,
    given,
  });
  const expanded = expandAnimPresets(scene, library);
  return { scene: checkScene(expanded.scene), notices: expanded.notices };
}

/** What a tool that writes a scene answers: the file it wrote and what a preset skipped. */
export const SceneResult = z.object({
  scene: z.string(),
  notices: z.array(z.string()),
});

export type SceneResult = z.infer<typeof SceneResult>;

/**
 * Writes `data` as scene `name` once it is valid; nothing is written otherwise (R4). With the
 * `previous` scene, resource notices are only about what changed (071/D3).
 */
export async function saveScene(
  ctx: ProjectCtx,
  name: string,
  data: unknown,
  previous?: Scene,
): Promise<SceneResult> {
  const prepared = await prepareScene(ctx, data, previous);
  const { notices } = prepared;
  const scene = withCanonicalAudio(
    {
      ...prepared.scene,
      elements: mapElementsDeep(prepared.scene.elements, (el) =>
        withCanonicalAssets(el, ctx.project),
      ),
    },
    ctx.project,
  );
  notices.push(...(await resourceNotices(ctx, scene, previous)));
  return { scene: await ctx.store.writeScene(name, scene), notices };
}

/** Opens scene `name`, applies `edit` (pure) and saves the result under the same name. */
export async function editScene(
  ctx: ProjectCtx,
  name: string,
  edit: (scene: Scene) => Scene,
): Promise<SceneResult> {
  const previous = await openScene(ctx, name);
  return saveScene(ctx, name, edit(previous), previous);
}

export type FoundPreset = {
  recipe: PresetRecipe;
  source: PresetSource;
  file: string;
};

/**
 * Fails at `field` when `name` is a built-in preset the project has no preset of its own for
 * (078/D8): built-ins are not files of the project, so they cannot be renamed or deleted.
 */
export async function refuseBuiltIn(
  ctx: Ctx,
  name: string,
  field: string,
): Promise<void> {
  const found = await findPreset(ctx, name).catch(() => undefined);
  if (found?.source === "built-in")
    fail(
      "built_in",
      `«${name}» es un preset integrado: no se puede renombrar ni borrar; guarda una copia con preset_save`,
      field,
    );
}

/**
 * The preset whose name or file name is `name` (user presets before built-ins of the same
 * name); a miss fails at `field`, the caller's parameter, listing the presets (of `kind`
 * when given) (080/D7).
 */
export async function findPreset(
  ctx: Ctx,
  name: string,
  { field = "preset", kind }: { field?: string; kind?: string } = {},
): Promise<FoundPreset> {
  const all = (await ctx.store.presets()).map((p) => ({
    ...p,
    recipe: asRecipe(p.data as PresetRecipe),
  }));
  const match = all
    .reverse()
    .find((p) => p.recipe.name === name || p.file === slugify(name));
  if (!match)
    fail(
      "not_found",
      `No existe el preset «${name}»${namesHint(
        name,
        all
          .filter((p) => kind === undefined || p.recipe.kind === kind)
          .map((p) => p.recipe.name)
          .reverse(),
        "preset_list",
      )}`,
      field,
    );
  return { recipe: match.recipe, source: match.source, file: match.file };
}
