/**
 * Pure scene expansion from compact representation (011/D2, D3, D4, D6, R1-R9).
 */

import {
  type CountUpScene,
  withCountUp,
} from "../../components/counter/count-up.ts";
import { dataFields } from "../../components/fields/index.ts";
import { descriptorOf } from "../../components/index.ts";
import { ensureDrawOnStroke } from "../../components/path/draw-on.ts";
import type { AnimPreset } from "../../model/anim-preset.ts";
import type {
  CompactElement,
  CompactScene,
  SceneDefaults,
} from "../../model/compact.ts";
import {
  type Background,
  defaultBackground,
  defaultElement,
  defaultScene,
  type Element,
  newId,
  type Scene,
} from "../../model/model.ts";
import type { PresetRecipe } from "../../model/preset.ts";
import { fromShotStart } from "../../model/shots.ts";
import { parseSize } from "../../model/size.ts";
import { TracksSchema } from "../../model/track.ts";
import { expandAnimPresets } from "../../presets/anim-presets.ts";
import {
  deepMerge,
  resolveBackground,
  resolvePreset,
} from "../../presets/resolve.ts";
import { solid } from "../../traits/solid.ts";
import { hasPositionTrack, trackOverridesAt } from "../elements/elements.ts";
import { resolveLineConnections } from "./connections.ts";
import { applySceneDefaults } from "./defaults.ts";
import { expandEffects } from "./effects.ts";
import { applyImplied } from "./implied.ts";
import { placeAt, resolveFitCanvas, resolveOrigin } from "./layout.ts";

type PresetResolver = (
  name: string,
) => Promise<PresetRecipe | undefined> | (PresetRecipe | undefined);

export type ExpandOptions = {
  findPreset?: PresetResolver;
  /** What a missing preset's message adds: the valid names (080/D7); nothing when absent. */
  presetHint?: (name: string) => string;
  animLibrary?: readonly AnimPreset[];
  /** The scene the compact one is laid over (the project's canvas, 074/D3); else the default. */
  base?: Scene;
};

/** What every element of one expansion shares (058/D3); `notices` collects what was ignored. */
type ExpandState = {
  findPreset?: PresetResolver;
  presetHint?: (name: string) => string;
  defaults?: SceneDefaults;
  notices: string[];
  /** The scene's symbols, so a `use` with no size takes its symbol's (056). */
  symbols?: Scene["symbols"];
  /** The scene's duration and shots, so a new counter's count-up fits its shot (072/D3). */
  timing: CountUpScene;
};

/** A CSS color written as hex, `rgb(…)` or `hsl(…)` (064/D9); named colors are not matched. */
const COLOR_PREFIX = /^(#|rgba?\(|hsla?\()/i;

/**
 * Resolves a background from a preset name, a color (a solid background) or a partial
 * object merged onto a solid background (064/D10); a string that is neither keeps the
 * default and pushes a notice (064/D9).
 */
export async function resolveSceneBackground(
  bgInput: unknown,
  notices: string[],
  findPreset?: PresetResolver,
  fallback: Background = defaultBackground(),
): Promise<Background> {
  const base = structuredClone(fallback);
  if (!bgInput) return base;

  if (typeof bgInput === "string") {
    const recipe = await findPreset?.(bgInput);
    if (recipe && recipe.kind === "background") {
      const resolved = resolveBackground(recipe);
      if ("background" in resolved) return resolved.background;
    }
    if (COLOR_PREFIX.test(bgInput.trim())) {
      solid.apply.background?.(base, { color: bgInput.trim() });
      return base;
    }
    notices.push(
      `Fondo «${bgInput}» ignorado: no es un preset de fondo ni un color; se usa el fondo por defecto`,
    );
    return base;
  }

  if (typeof bgInput === "object" && bgInput !== null) {
    solid.apply.background?.(base, { color: base.color });
    deepMerge(
      base as unknown as Record<string, unknown>,
      bgInput as Record<string, unknown>,
    );
  }

  return base;
}

/** Normalizes anim shorthand: if a string or single kind is given, maps it to { in/loop: ... } */
function normalizeAnim(rawAnim: unknown): unknown {
  if (typeof rawAnim === "string") {
    const kind = rawAnim.toLowerCase();
    const LOOP_CANDIDATES = [
      "float",
      "pulse",
      "breathe",
      "spin",
      "bounce",
      "glow",
    ];
    if (LOOP_CANDIDATES.includes(kind)) {
      return {
        loop: { kind, amount: 12, cycles: 1, delay: 0 },
      };
    }
    return {
      in: { kind, amount: 12, delay: 0, from: "down" },
    };
  }

  if (typeof rawAnim === "object" && rawAnim !== null) {
    const animObj = { ...(rawAnim as Record<string, unknown>) };
    if (typeof animObj.in === "string") {
      animObj.in = { kind: animObj.in };
    }
    if (typeof animObj.loop === "string") {
      animObj.loop = { kind: animObj.loop };
    }
    if (typeof animObj.out === "string") {
      animObj.out = { kind: animObj.out };
    }
    return animObj;
  }

  return rawAnim;
}

/** Builds an element from preset or kind, applying deepMerge and children expansion */
async function buildElement(
  raw: CompactElement,
  state: ExpandState,
  path: string,
): Promise<Element> {
  const { findPreset } = state;
  let element: Element;

  const rawPreset = raw.preset as string | undefined;
  const rawKind = raw.kind as Element["kind"] | undefined;

  if (rawPreset && findPreset) {
    const recipe = await findPreset(rawPreset);
    if (recipe) {
      const resolved = resolvePreset(recipe);
      if ("element" in resolved) {
        element = resolved.element;
      } else {
        throw new Error(
          `${path}.preset: El preset «${rawPreset}» no es un elemento`,
        );
      }
    } else {
      throw new Error(
        `${path}.preset: No existe el preset «${rawPreset}»${state.presetHint?.(rawPreset) ?? ""}`,
      );
    }
  } else if (rawKind) {
    element = defaultElement(rawKind);
    applySceneDefaults(element, state.defaults);
  } else {
    throw new Error(
      `${path}: El elemento compacto debe especificar 'kind' o 'preset'`,
    );
  }

  const {
    preset: _preset,
    kind: _kind,
    at,
    fit,
    origin,
    from,
    to,
    tracks,
    anim,
    animPreset,
    children,
    template,
    effects,
    ...overrides
  } = raw as Record<string, unknown>;

  // only "canvas" is the placement shortcut; any other `fit` is the kind's own field (polygon `box`)
  if (fit !== undefined && fit !== "canvas") overrides.fit = fit;

  if (overrides.id) {
    element.id = String(overrides.id);
  }

  for (const [k, f] of dataFields(descriptorOf(element.kind)?.fields ?? {}))
    if (f.type === "text" && f.multiline && Array.isArray(overrides[k]))
      overrides[k] = (overrides[k] as string[]).join("\n");
  deepMerge(element as unknown as Record<string, unknown>, overrides);
  if (!(rawPreset && findPreset)) applyImplied(element, overrides);

  if (effects !== undefined) {
    const expanded = expandEffects(
      element.effects,
      effects as Record<string, unknown>,
      `${path}.effects`,
      Object.keys(element),
    );
    element.effects = expanded.effects;
    state.notices.push(...expanded.notices);
  }

  if (anim !== undefined) {
    const normalized = normalizeAnim(anim);
    if (
      typeof normalized === "object" &&
      normalized !== null &&
      typeof element.anim === "object" &&
      element.anim !== null
    ) {
      deepMerge(
        element.anim as unknown as Record<string, unknown>,
        normalized as Record<string, unknown>,
      );
    } else {
      (element as unknown as Record<string, unknown>).anim = normalized;
    }
  }
  // an explicit stroke width, even 0, wins over the draw-on default (063/D4)
  const border = overrides.border as { width?: unknown } | undefined;
  if (border?.width === undefined) ensureDrawOnStroke(element);

  if (animPreset !== undefined) {
    if (typeof animPreset === "string") {
      element.animPreset = { name: animPreset, start: 0 };
    } else if (typeof animPreset === "object" && animPreset !== null) {
      element.animPreset = animPreset as { name: string; start: number };
    }
  }

  // a preset's own tracks run in its shot's time; tracks the input gives replace them (074/D4)
  const presetTracks =
    rawPreset && !tracks ? Object.keys(element.tracks ?? {}) : [];
  if (tracks) {
    element.tracks = TracksSchema.parse(tracks);
  }
  element = rawPreset
    ? fromShotStart(element, presetTracks, state.timing.shots)
    : withCountUp(element, raw, state.timing);

  if (origin !== undefined) {
    element.origin = resolveOrigin(
      origin as import("../../model/compact.ts").CompactOrigin,
    );
  }

  if (element.kind === "use") {
    const symbol = state.symbols?.[element.symbol];
    if (symbol && overrides.w === undefined) element.w = symbol.w;
    if (symbol && overrides.h === undefined) element.h = symbol.h;
  }

  // Preserve placement hints for the post-layout pass
  if (at) (element as unknown as Record<string, unknown>).__at = at;
  if (at && hasPositionTrack(element))
    state.notices.push(trackOverridesAt(path));
  if (fit === "canvas")
    (element as unknown as Record<string, unknown>).__fit = fit;
  // a line attaches to `from`/`to` later; any other kind takes them as its own fields (074/D7)
  if (from !== undefined)
    (element as unknown as Record<string, unknown>).from = from;
  if (to !== undefined) (element as unknown as Record<string, unknown>).to = to;

  // Handle nested children for groups
  if (element.kind === "group" && Array.isArray(children)) {
    const builtChildren: Element[] = [];
    for (const [i, child] of children.entries()) {
      builtChildren.push(
        await buildElement(
          child as CompactElement,
          state,
          `${path}.children.${i}`,
        ),
      );
    }
    element.children = builtChildren;
  }

  // Handle template for particles
  if (
    element.kind === "particles" &&
    template &&
    typeof template === "object"
  ) {
    element.template = await buildElement(
      template as CompactElement,
      state,
      `${path}.template`,
    );
  }

  return element;
}

/**
 * Pure function: expands a CompactScene into a full canonical Scene, with `notices` for
 * what it ignored (058/D3).
 */
export async function expandScene(
  compact: CompactScene,
  options: ExpandOptions = {},
): Promise<{ scene: Scene; notices: string[] }> {
  const scene = structuredClone(options.base ?? defaultScene());
  const state: ExpandState = {
    findPreset: options.findPreset,
    presetHint: options.presetHint,
    defaults: compact.defaults,
    notices: [],
    timing: {
      duration: compact.duration ?? scene.duration,
      shots: compact.shots,
    },
  };

  const failures: string[] = [];
  if (compact.size !== undefined) {
    const dims = parseSize(compact.size);
    if ("error" in dims) failures.push(`size: ${dims.error}`);
    else {
      scene.width = dims.width;
      scene.height = dims.height;
    }
  }
  scene.width = compact.width ?? scene.width;
  scene.height = compact.height ?? scene.height;

  if (compact.duration !== undefined) scene.duration = compact.duration;
  if (compact.fps !== undefined) scene.fps = compact.fps;

  scene.background = await resolveSceneBackground(
    compact.background,
    state.notices,
    options.findPreset,
    scene.background,
  );

  const elements: Element[] = [];
  const seenIds = new Set<string>();

  if (compact.symbols) {
    scene.symbols = {};
    for (const [symName, symDef] of Object.entries(compact.symbols)) {
      const symElements: Element[] = [];
      const symSeenIds = new Set<string>();
      for (const [i, rawEl] of (symDef.children ?? []).entries()) {
        const el = await buildElement(
          rawEl,
          state,
          `symbols.${symName}.children.${i}`,
        );
        if (rawEl.id) {
          if (symSeenIds.has(el.id)) {
            throw new Error(
              `symbols.${symName}.children.${i}.id: ID duplicado «${el.id}» en el símbolo «${symName}»`,
            );
          }
          symSeenIds.add(el.id);
        } else if (!el.id) {
          el.id = newId();
        }
        symElements.push(el);
      }
      applyLayoutPass(symElements, { width: symDef.w, height: symDef.h });
      resolveLineConnections(symElements);
      scene.symbols[symName] = {
        w: symDef.w,
        h: symDef.h,
        children: symElements,
      };
    }
  }

  state.symbols = scene.symbols;
  for (const [i, given] of (compact.elements ?? []).entries()) {
    // with no placement at all, a top-level element is centred, as element_add does (069/D11)
    const unplaced =
      given.kind !== "line" &&
      ["at", "x", "y", "a", "b"].every((k) => !(k in given)) &&
      given.fit !== "canvas";
    const rawEl = unplaced ? { ...given, at: "center" as const } : given;
    // every element is built, so one failure does not hide the next (069/D12)
    let el: Element;
    try {
      el = await buildElement(rawEl, state, `elements.${i}`);
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    if (rawEl.id) {
      if (seenIds.has(el.id)) {
        failures.push(
          `elements.${i}.id: ID duplicado «${el.id}» en la escena compacta`,
        );
        continue;
      }
      seenIds.add(el.id);
    } else if (!el.id) {
      el.id = newId();
    }

    elements.push(el);
  }

  if (failures.length > 0) throw new Error(failures.join("\n"));

  // Post-layout pass: resolve fit and anchors (at root and inside groups)
  function applyLayoutPass(
    items: Element[],
    container: { width: number; height: number },
  ) {
    for (const [i, item] of items.entries()) {
      let el = item;
      const mutable = el as unknown as Record<string, unknown>;
      if (mutable.__fit === "canvas") {
        resolveFitCanvas(el, container);
        delete mutable.__fit;
      }
      if (mutable.__at) {
        const at = mutable.__at as import("../../model/compact.ts").AtPlacement;
        delete mutable.__at;
        el = placeAt(el, at, container);
        items[i] = el;
      }
      if (el.kind === "group" && Array.isArray(el.children)) {
        const size = el as { w?: unknown; h?: unknown };
        applyLayoutPass(el.children, {
          width: typeof size.w === "number" ? size.w : container.width,
          height: typeof size.h === "number" ? size.h : container.height,
        });
      }
    }
  }

  applyLayoutPass(elements, scene);

  // Post-connections pass: resolve from / to
  resolveLineConnections(elements);

  scene.elements = elements;

  if (compact.shots && compact.shots.length > 0) {
    scene.shots = compact.shots.map((sh) => ({
      id: sh.id,
      name: sh.name ?? sh.id,
      start: sh.start,
      end: sh.end,
      transition: sh.transition,
      camera: sh.camera?.tracks
        ? { ...sh.camera, tracks: TracksSchema.parse(sh.camera.tracks) }
        : sh.camera,
    }));
  }

  if (compact.audioTracks) {
    scene.audioTracks = compact.audioTracks.map((track, i) => ({
      ...track,
      id: track.id ?? `track-${i + 1}`,
    }));
  }

  if (options.animLibrary && options.animLibrary.length > 0) {
    const expanded = expandAnimPresets(scene, options.animLibrary);
    return {
      scene: expanded.scene,
      notices: [...state.notices, ...expanded.notices],
    };
  }

  return { scene, notices: state.notices };
}
