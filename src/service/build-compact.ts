import type { AnimPreset } from "../model/anim-preset.ts";
import {
  type CompactScene,
  type CompactSceneInput,
  CompactSceneSchema,
} from "../model/compact.ts";
import { idPath } from "../model/id-path.ts";
import { ignoredFields, ignoredNotice, namesHint } from "../model/ignored.ts";
import type { Scene } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { cameraOutsideShot } from "../model/shots.ts";
import { flatIssues } from "../model/zod-issues.ts";
import { asRecipe } from "../presets/store.ts";
import { expandScene } from "./compact/expand.ts";
import type { ProjectCtx } from "./ctx.ts";
import { estimatedWidthNotices, type Face, fontNotices } from "./font-check.ts";
import { withFileAspects } from "./image-aspect.ts";
import {
  failAll,
  type Problem,
  remapFailure,
  ToolFailure,
} from "./registry.ts";

const join = (prefix: string, path: string) =>
  path ? `${prefix}.${path}` : prefix;

import { sceneDefaults } from "./scene-defaults.ts";
import { resourceNotices } from "./scene-resources.ts";
import {
  animLibrary,
  checkWholeScene,
  findPreset,
  rawRuleProblems,
} from "./scenes.ts";

type Raw = Record<string, unknown>;
const isRaw = (v: unknown): v is Raw =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * A compact scene's raw elements as the rules read a scene's (075/D3): a line's `from`/`to`
 * are its targets (074/D7), an `animPreset` name stands for `{ name }` and the scene's
 * duration is the one given, else the project's.
 */
function asRuleData(input: CompactSceneInput, duration: number): unknown {
  const view = (el: unknown): unknown => {
    if (!isRaw(el)) return el;
    const out: Raw = { ...el };
    if (el.kind === "line") {
      if (typeof el.from === "string") out.a = { attach: el.from };
      if (typeof el.to === "string") out.b = { attach: el.to };
    }
    if (typeof el.animPreset === "string")
      out.animPreset = { name: el.animPreset };
    if (Array.isArray(el.children)) out.children = el.children.map(view);
    return out;
  };
  // a compact shot's name defaults to its id, as the expansion writes it
  const shots = input.shots?.map((sh) => ({ ...sh, name: sh.name ?? sh.id }));
  return {
    ...input,
    duration: input.duration ?? duration,
    shots,
    elements: input.elements.map(view),
  };
}

/**
 * Fails with every problem of a compact scene whose elements do not parse (080/D5): each
 * element problem and each rule it breaks, under `compact`, an element named by the id the
 * input gave.
 */
function failCompact(
  input: CompactSceneInput,
  issues: Parameters<typeof flatIssues>[0],
  library: readonly AnimPreset[],
  duration: number,
): never {
  const named = (path: string) => join("compact", idPath(input, path));
  const problems: Problem[] = [
    ...flatIssues(issues).map((i) => ({
      path: named(i.path.map(String).join(".")),
      message: i.message,
    })),
    ...rawRuleProblems(asRuleData(input, duration), library).map((p) => ({
      ...p,
      path: named(p.path),
    })),
  ];
  failAll("invalid_scene", problems);
}

/**
 * Expands and checks a compact scene, with every notice `scene_build` gives (064/D11):
 * ignored paths, what the expansion skipped, missing fonts and estimated widths.
 */
export async function buildCompact(
  ctx: ProjectCtx,
  input: CompactSceneInput,
  fonts: readonly Face[],
  { resources = true } = {},
): Promise<{ scene: Scene; compact: CompactScene; notices: string[] }> {
  let scene: Scene;
  let notices: string[];
  const library = await animLibrary(ctx);
  const base = await sceneDefaults(ctx);
  const presets = await ctx.store.presets();
  const parsed = CompactSceneSchema.safeParse(input);
  if (!parsed.success)
    failCompact(input, parsed.error.issues, library, base.duration);
  const compact = parsed.data;
  try {
    const full = await expandScene(compact, {
      findPreset: async (name) => {
        try {
          return (await findPreset(ctx, name)).recipe;
        } catch {
          return undefined;
        }
      },
      presetHint: (name) =>
        namesHint(
          name,
          presets.map((p) => asRecipe(p.data as PresetRecipe).name),
          "preset_list",
        ),
      animLibrary: library,
      base,
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
      // keys the compact element schema dropped, named as errors name them (080/D6)
      ...ignoredFields(
        { elements: input.elements, symbols: input.symbols },
        { elements: compact.elements, symbols: compact.symbols },
      ).map((f) =>
        ignoredNotice({ ...f, path: join("compact", idPath(input, f.path)) }),
      ),
      ...ignoredFields(full.scene, scene).map(ignoredNotice),
      ...full.notices,
      ...(scene.shots ?? []).flatMap((sh) => cameraOutsideShot(sh) ?? []),
    ];
  } catch (err: unknown) {
    // the failing path is the compact one, an element named by its id (069/D12, 080/D5)
    const named = (path: string) => join("compact", idPath(input, path));
    if (err instanceof ToolFailure)
      throw new ToolFailure(remapFailure(err.error, named));
    // the expansion fails with one «path: message» line per problem
    const msg = err instanceof Error ? err.message : String(err);
    failAll(
      "invalid_compact_scene",
      msg.split("\n").map((line) => {
        const path = /^([\w./-]+): /.exec(line)?.[1];
        return path
          ? { path: named(path), message: line.slice(path.length + 2) }
          : { path: "compact", message: line };
      }),
    );
  }
  notices.push(
    ...fontNotices(scene, fonts),
    ...estimatedWidthNotices(scene),
    // a build that is then saved leaves these to the save (070/D3)
    ...(resources ? await resourceNotices(ctx, scene) : []),
  );
  return { scene, compact, notices };
}
