/**
 * Pure scene expansion from compact representation (011/D2, D3, D4, D6, R1-R9).
 */

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
  SIZE_PRESETS,
} from "../../model/model.ts";
import type { PresetRecipe } from "../../model/preset.ts";
import { expandAnimPresets } from "../../presets/anim-presets.ts";
import {
  deepMerge,
  resolveBackground,
  resolvePreset,
} from "../../presets/resolve.ts";
import { resolveLineConnections } from "./connections.ts";
import { applySceneDefaults } from "./defaults.ts";
import { expandEffects } from "./effects.ts";
import {
  resolveAtPlacement,
  resolveFitCanvas,
  resolveOrigin,
} from "./layout.ts";
import { normalizeTracks } from "./tracks.ts";

type PresetResolver = (
  name: string,
) => Promise<PresetRecipe | undefined> | (PresetRecipe | undefined);

export type ExpandOptions = {
  findPreset?: PresetResolver;
  animLibrary?: readonly AnimPreset[];
};

/** What every element of one expansion shares (058/D3); `notices` collects what was ignored. */
type ExpandState = {
  findPreset?: PresetResolver;
  defaults?: SceneDefaults;
  notices: string[];
};

/** Parses size specification (e.g. "1080x1080", "1920x1080", "story", or [w, h]) */
function resolveSceneDimensions(size?: string | [number, number]): {
  width: number;
  height: number;
} {
  if (Array.isArray(size)) {
    return { width: size[0], height: size[1] };
  }
  if (!size) {
    return { width: 1080, height: 1080 };
  }

  const dimMatch = size.match(/^(\d+)[x×](\d+)$/i);
  if (dimMatch) {
    return {
      width: Number.parseInt(dimMatch[1], 10),
      height: Number.parseInt(dimMatch[2], 10),
    };
  }

  const normalized = size.toLowerCase();
  const preset = SIZE_PRESETS.find((p) =>
    p.label.toLowerCase().includes(normalized),
  );
  if (preset) {
    return { width: preset.width, height: preset.height };
  }

  return { width: 1080, height: 1080 };
}

/** Resolves background from preset name or partial object */
async function resolveSceneBackground(
  bgInput: unknown,
  findPreset?: PresetResolver,
): Promise<Background> {
  const base = defaultBackground();
  if (!bgInput) return base;

  if (typeof bgInput === "string") {
    if (findPreset) {
      const recipe = await findPreset(bgInput);
      if (recipe && recipe.kind === "background") {
        const resolved = resolveBackground(recipe);
        if ("background" in resolved) return resolved.background;
      }
    }
    return base;
  }

  if (typeof bgInput === "object" && bgInput !== null) {
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
        throw new Error(`El preset «${rawPreset}» no es un elemento`);
      }
    } else {
      throw new Error(`No existe el preset «${rawPreset}»`);
    }
  } else if (rawKind) {
    element = defaultElement(rawKind);
    applySceneDefaults(element, state.defaults);
  } else {
    throw new Error("El elemento compacto debe especificar 'kind' o 'preset'");
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

  if (overrides.id) {
    element.id = String(overrides.id);
  }

  deepMerge(element as unknown as Record<string, unknown>, overrides);

  if (effects !== undefined) {
    const expanded = expandEffects(
      element.effects,
      effects as Record<string, unknown>,
      `${path}.effects`,
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

  if (animPreset !== undefined) {
    if (typeof animPreset === "string") {
      element.animPreset = { name: animPreset, start: 0 };
    } else if (typeof animPreset === "object" && animPreset !== null) {
      element.animPreset = animPreset as { name: string; start: number };
    }
  }

  if (tracks) {
    element.tracks = normalizeTracks(
      tracks as Record<string, import("./tracks.ts").CompactTrackInput>,
    );
  }

  if (origin !== undefined) {
    element.origin = resolveOrigin(
      origin as import("../../model/compact.ts").CompactOrigin,
    );
  }

  // Preserve placement hints for the post-layout pass
  if (at) (element as unknown as Record<string, unknown>).__at = at;
  if (fit) (element as unknown as Record<string, unknown>).__fit = fit;
  if (from) (element as unknown as Record<string, unknown>).from = from;
  if (to) (element as unknown as Record<string, unknown>).to = to;

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
  const scene = defaultScene();
  const state: ExpandState = {
    findPreset: options.findPreset,
    defaults: compact.defaults,
    notices: [],
  };

  const dims = resolveSceneDimensions(
    compact.size as string | [number, number],
  );
  scene.width = compact.width ?? dims.width;
  scene.height = compact.height ?? dims.height;

  if (compact.duration !== undefined) scene.duration = compact.duration;
  if (compact.fps !== undefined) scene.fps = compact.fps;

  scene.background = await resolveSceneBackground(
    compact.background,
    options.findPreset,
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
              `ID duplicado «${el.id}» en el símbolo «${symName}»`,
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

  for (const [i, rawEl] of (compact.elements ?? []).entries()) {
    const el = await buildElement(rawEl, state, `elements.${i}`);

    if (rawEl.id) {
      if (seenIds.has(el.id)) {
        throw new Error(`ID duplicado «${el.id}» en la escena compacta`);
      }
      seenIds.add(el.id);
    } else if (!el.id) {
      el.id = newId();
    }

    elements.push(el);
  }

  // Post-layout pass: resolve fit and anchors (at root and inside groups)
  function applyLayoutPass(
    items: Element[],
    container: { width: number; height: number },
  ) {
    for (const el of items) {
      const mutable = el as unknown as Record<string, unknown>;
      if (mutable.__fit === "canvas") {
        resolveFitCanvas(el, container);
        delete mutable.__fit;
      }
      if (mutable.__at) {
        resolveAtPlacement(
          el,
          mutable.__at as import("../../model/compact.ts").AtPlacement,
          container,
        );
        delete mutable.__at;
      }
      if (el.kind === "group" && Array.isArray((el as any).children)) {
        const groupEl = el as any;
        applyLayoutPass(groupEl.children, {
          width: typeof groupEl.w === "number" ? groupEl.w : container.width,
          height: typeof groupEl.h === "number" ? groupEl.h : container.height,
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
      camera: sh.camera
        ? {
            x: sh.camera.x,
            y: sh.camera.y,
            zoom: sh.camera.zoom,
            tracks: sh.camera.tracks
              ? normalizeTracks(
                  sh.camera.tracks as Record<
                    string,
                    import("./tracks.ts").CompactTrackInput
                  >,
                )
              : undefined,
          }
        : undefined,
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
