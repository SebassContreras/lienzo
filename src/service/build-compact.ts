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
import { parseSize } from "../model/size.ts";
import { flatIssues } from "../model/zod-issues.ts";
import { asRecipe } from "../presets/store.ts";
import { withFileAspects } from "./assets/image-aspect.ts";
import { expandScene } from "./compact/expand.ts";
import type { ProjectCtx } from "./ctx.ts";
import {
  estimatedWidthNotices,
  type Face,
  fontNotices,
} from "./fonts/font-check.ts";
import {
  failAll,
  type Problem,
  remapFailure,
  ToolFailure,
} from "./registry.ts";

const join = (prefix: string, path: string) =>
  path ? `${prefix}.${path}` : prefix;

import { sceneDefaults } from "./scenes/scene-defaults.ts";
import { deadKeyframeEasingNotices } from "./scenes/scene-notices.ts";
import { resourceNotices } from "./scenes/scene-resources.ts";
import {
  animLibrary,
  checkWholeScene,
  findPreset,
  rawRuleProblems,
} from "./scenes/scenes.ts";

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
function compactProblems(
  input: CompactSceneInput,
  issues: Parameters<typeof flatIssues>[0],
  library: readonly AnimPreset[],
  duration: number,
): Problem[] {
  const named = (path: string) => join("compact", idPath(input, path));
  const size = input.size === undefined ? undefined : parseSize(input.size);
  const problems: Problem[] = [
    ...(size && "error" in size
      ? [{ path: "compact.size", message: size.error }]
      : []),
    ...flatIssues(issues).map((i) => ({
      path: named(i.path.map(String).join(".")),
      message: i.message,
    })),
    ...rawRuleProblems(asRuleData(input, duration), library).map((p) => ({
      ...p,
      path: named(p.path),
    })),
  ];
  return problems;
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
  const library = await animLibrary(ctx);
  const base = await sceneDefaults(ctx);
  const presets = await ctx.store.presets();
  const expandChecked = async (
    compact: CompactScene,
  ): Promise<{ scene: Scene; notices: string[] }> => {
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
    return { scene, notices };
  };
  const parsed = CompactSceneSchema.safeParse(input);
  if (!parsed.success) {
    const early = compactProblems(
      input,
      parsed.error.issues,
      library,
      base.duration,
    );
    // the elements that did parse still get the expansion stage (081/D9)
    const later = await laterProblems(
      input,
      parsed.error.issues,
      expandChecked,
    );
    const seen = new Set<string>();
    failAll(
      "invalid_scene",
      [...early, ...later].filter((p) => {
        const key = `${p.path}|${p.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
  }
  const compact = parsed.data;
  const checked = await expandChecked(compact);
  const scene = checked.scene;
  const notices = checked.notices;
  notices.push(
    ...fontNotices(scene, fonts),
    ...estimatedWidthNotices(scene),
    ...deadKeyframeEasingNotices(scene).map((n) => n.message),
    // a build that is then saved leaves these to the save (070/D3)
    ...(resources ? await resourceNotices(ctx, scene) : []),
  );
  return { scene, compact, notices };
}

/**
 * The problems the expansion stage finds in the elements of `input` whose schema problems are
 * already listed (081/D9): each of those is replaced by a plain rect of its id, which keeps
 * every index and name, and a key of the scene that failed is left out.
 */
async function laterProblems(
  input: CompactSceneInput,
  issues: Parameters<typeof flatIssues>[0],
  expandChecked: (compact: CompactScene) => Promise<unknown>,
): Promise<Problem[]> {
  const bad = new Set<number>();
  const rest: Raw = { ...input };
  for (const issue of issues) {
    const [head, index] = issue.path;
    if (head === "elements" && typeof index === "number") bad.add(index);
    else if (typeof head === "string") delete rest[head];
  }
  rest.elements = (input.elements ?? []).map((el, i) =>
    bad.has(i)
      ? {
          kind: "rect",
          ...(isRaw(el) && typeof el.id === "string" ? { id: el.id } : {}),
        }
      : el,
  );
  const again = CompactSceneSchema.safeParse(rest);
  if (!again.success) return [];
  try {
    await expandChecked(again.data);
    return [];
  } catch (err) {
    if (!(err instanceof ToolFailure)) throw err;
    return (
      err.error.errors ?? [{ path: err.error.path, message: err.error.message }]
    );
  }
}
