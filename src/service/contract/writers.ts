/**
 * How each scene writer takes scene content (082/D6): an adapter turns a rule's `Violation` into
 * the calls that set the scene up and the call that must fail. An adapter that cannot carry a
 * violation says why, in `NOT_CARRIED`; a writer with neither fails the matrix.
 */
import type { Violation } from "./rules.ts";

type Fields = Record<string, unknown>;
export type Call = { tool: string; input: Fields };

/** The calls that set a scene up, and the one that is expected to fail. */
export type Plan = { arrange: Call[]; call: Call };

export type Writer = {
  id: string;
  /** The tool this adapter calls. */
  tool: string;
  plan: (v: Violation) => Plan | undefined;
};

const shotCalls = (v: Violation): Call[] =>
  (v.shots ?? []).map((shot) => ({
    tool: "shot_set",
    input: { scene: "s", ...shot },
  }));

const withoutKind = ({ kind: _kind, ...rest }: Fields) => rest;

/** The elements of `v` that come before the last one, added to scene `s`. */
const earlier = (v: Violation): Call[] =>
  (v.elements ?? []).slice(0, -1).map((e) => ({
    tool: "element_add",
    input: { scene: "s", kind: e.kind, patch: withoutKind(e) },
  }));

const content = (v: Violation) => ({
  ...(v.scene ?? {}),
  ...(v.shots ? { shots: v.shots } : {}),
  ...(v.elements ? { elements: v.elements } : {}),
});

const compactContent = (v: Violation) => ({
  ...(v.scene ?? {}),
  ...(v.shots ? { shots: v.shots } : {}),
  ...(v.compactElements || v.elements
    ? { elements: v.compactElements ?? v.elements }
    : {}),
});

const lastElement = (v: Violation) => (v.elements ?? []).at(-1);

export const WRITERS: readonly Writer[] = [
  {
    id: "scene_create",
    tool: "scene_create",
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_create", input: { scene: "t", data: content(v) } },
    }),
  },
  {
    id: "scene_validate (data)",
    tool: "scene_validate",
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_validate", input: { data: content(v) } },
    }),
  },
  {
    id: "scene_validate (compact)",
    tool: "scene_validate",
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_validate", input: { compact: compactContent(v) } },
    }),
  },
  {
    id: "scene_build",
    tool: "scene_build",
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_build", input: { compact: compactContent(v) } },
    }),
  },
  {
    id: "element_add",
    tool: "element_add",
    plan: (v) => {
      const last = lastElement(v);
      if (!last) return undefined;
      return {
        arrange: [...shotCalls(v), ...earlier(v)],
        call: {
          tool: "element_add",
          input: { scene: "s", kind: last.kind, patch: withoutKind(last) },
        },
      };
    },
  },
  {
    id: "element_update",
    tool: "element_update",
    plan: (v) => {
      const [only, ...more] = v.elements ?? [];
      if (!only || more.length > 0) return undefined;
      const { id, kind, ...patch } = only;
      return {
        arrange: [
          ...shotCalls(v),
          { tool: "element_add", input: { scene: "s", kind, patch: { id } } },
        ],
        call: { tool: "element_update", input: { scene: "s", id, patch } },
      };
    },
  },
  {
    id: "scene_update (symbol children)",
    tool: "scene_update",
    plan: (v) => {
      if (!v.elements) return undefined;
      return {
        arrange: shotCalls(v),
        call: {
          tool: "scene_update",
          input: {
            scene: "s",
            patch: {
              symbols: { chip: { w: 100, h: 100, children: v.elements } },
            },
          },
        },
      };
    },
  },
];

/**
 * Cells the matrix does not run, with the reason (`writer id` → `rule id` → why). A writer that
 * is not here and returns no plan fails `matrix.test.ts`.
 */
export const NOT_CARRIED: Record<string, Record<string, string>> = {
  element_update: {
    "element ids are unique":
      "an update never changes an id, so it cannot repeat one",
  },
};

/**
 * Tools that save a scene (`effects` has `scene`) and are not in `WRITERS`, with the reason.
 * A tool with `effects: ["scene"]` that is in neither fails `matrix.test.ts`, so a new scene
 * writer has to be given adapters or a reason.
 */
export const NOT_WRITERS: Record<string, string> = {
  asset_rename:
    "rewrites asset references in scenes through the store; it takes no scene content",
  element_move: "reorders existing elements; it takes no content",
  element_remove: "removes an element; it takes no content",
  element_ungroup: "dissolves a group; it takes no content",
  image_trim: "sets a crop from the picture's pixels; it takes no content",
  keyframe_remove: "removes a keyframe; it takes no content",
  scene_delete: "removes a scene file; it takes no content",
  scene_rename: "renames a scene file; it takes no content",
  scene_generate_speech:
    "attaches the audio the speech service returns; the user's content is the script",
  background_set:
    "TODO T021: carries background values (spotlight is a fraction)",
  element_group: "TODO T021: carries the id of the new group (ids are unique)",
  keyframe_set: "TODO T021: carries keyframe values and easings",
  shot_set: "TODO T021: carries shots (spans, ids, camera easings)",
};
