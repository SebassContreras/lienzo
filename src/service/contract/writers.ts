/**
 * How each scene writer takes scene content (082/D6): an adapter turns a rule's `Violation` into
 * the calls that set the scene up and the call that must answer. A writer runs the violations
 * made of the kinds of content it `handles`; when it handles one and cannot carry it, `NOT_CARRIED`
 * says why, and a writer with neither fails `matrix.test.ts`.
 */
import { idProblem } from "../../model/ids.ts";
import type { Rule, Violation } from "./rules.ts";

type Fields = Record<string, unknown>;
export type Call = { tool: string; input: Fields };

/** The calls that set a scene up, and the one whose answer is checked. */
export type Plan = { arrange: Call[]; call: Call };

type Content = Exclude<keyof Violation, "label" | "onCanvas">;

export type Writer = {
  id: string;
  /** The tool this adapter calls. */
  tool: string;
  /** The kinds of content this writer takes. */
  handles: readonly Content[];
  plan: (v: Violation) => Plan | undefined;
};

const shotCalls = (shots: Fields[] = []): Call[] =>
  shots.map((shot) => ({ tool: "shot_set", input: { scene: "s", ...shot } }));

/** The scene's symbols and shots a violation relies on, set up through the tools that own them. */
const contextCalls = (v: Violation): Call[] => [
  ...(v.symbols
    ? [
        {
          tool: "scene_update",
          input: { scene: "s", patch: { symbols: v.symbols } },
        },
      ]
    : []),
  ...shotCalls(v.shots),
];

const withoutKind = ({ kind: _kind, ...rest }: Fields) => rest;

const add = (e: Fields): Call => ({
  tool: "element_add",
  input: { scene: "s", kind: e.kind, patch: withoutKind(e) },
});

/** Every id in `elements`, at any depth, in order. */
function idsOf(elements: Fields[] = []): string[] {
  return elements.flatMap((e) => [
    String(e.id),
    ...idsOf((e.children as Fields[] | undefined) ?? []),
  ]);
}
const repeatsIds = (elements: Fields[] = []) => {
  const ids = idsOf(elements);
  return new Set(ids).size !== ids.length;
};

const data = (v: Violation) => ({
  ...(v.scene ?? {}),
  ...(v.symbols ? { symbols: v.symbols } : {}),
  ...((v.shotContent ?? v.shots) ? { shots: v.shotContent ?? v.shots } : {}),
  ...(v.elements ? { elements: v.elements } : {}),
  ...(v.background ? { background: v.background } : {}),
});

const compact = (v: Violation) => ({
  ...data(v),
  ...((v.compactElements ?? v.elements)
    ? { elements: v.compactElements ?? v.elements }
    : {}),
});

/** The compact form takes an empty id as an id left out. */
const noId = (v: Violation) => v.elements?.some((e) => e.id === "");

export const WRITERS: readonly Writer[] = [
  {
    id: "scene_create",
    tool: "scene_create",
    handles: ["elements", "shotContent", "scene", "background"],
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_create", input: { scene: "t", data: data(v) } },
    }),
  },
  {
    id: "scene_validate (data)",
    tool: "scene_validate",
    handles: ["elements", "shotContent", "scene", "background"],
    plan: (v) => ({
      arrange: [],
      call: { tool: "scene_validate", input: { data: data(v) } },
    }),
  },
  {
    id: "scene_validate (compact)",
    tool: "scene_validate",
    handles: ["elements", "shotContent", "scene", "background"],
    plan: (v) =>
      noId(v)
        ? undefined
        : {
            arrange: [],
            call: { tool: "scene_validate", input: { compact: compact(v) } },
          },
  },
  {
    id: "scene_build",
    tool: "scene_build",
    handles: ["elements", "shotContent", "scene", "background"],
    plan: (v) =>
      noId(v)
        ? undefined
        : {
            arrange: [],
            call: { tool: "scene_build", input: { compact: compact(v) } },
          },
  },
  {
    id: "element_add",
    tool: "element_add",
    handles: ["elements"],
    plan: (v) => {
      const last = v.elements?.at(-1);
      if (!last) return undefined;
      return {
        arrange: [
          ...contextCalls(v),
          ...(v.elements ?? []).slice(0, -1).map(add),
        ],
        call: add(last),
      };
    },
  },
  {
    id: "element_update",
    tool: "element_update",
    handles: ["elements"],
    plan: (v) => {
      const last = v.elements?.at(-1);
      if (!last || repeatsIds(v.elements) || idProblem(last.id))
        return undefined;
      const { id, kind, ...patch } = last;
      return {
        arrange: [
          ...contextCalls(v),
          ...(v.elements ?? []).slice(0, -1).map(add),
          {
            tool: "element_add",
            input: { scene: "s", kind, patch: { id, ...v.valid } },
          },
        ],
        call: { tool: "element_update", input: { scene: "s", id, patch } },
      };
    },
  },
  {
    id: "scene_update",
    tool: "scene_update",
    handles: ["scene", "elements"],
    plan: (v) => {
      // a symbol's body is drawn where a `use` places it, so it has no place on the canvas
      if (v.onCanvas) return undefined;
      return {
        arrange: shotCalls(v.shots),
        call: {
          tool: "scene_update",
          input: {
            scene: "s",
            patch: v.scene ?? {
              symbols: { chip: { w: 100, h: 100, children: v.elements } },
            },
          },
        },
      };
    },
  },
  {
    id: "shot_set",
    tool: "shot_set",
    handles: ["shotContent"],
    plan: (v) => {
      const last = v.shotContent?.at(-1);
      const ids = (v.shotContent ?? []).map((s) => s.id);
      if (!last || new Set(ids).size !== ids.length) return undefined;
      return {
        arrange: shotCalls(v.shotContent?.slice(0, -1)),
        call: { tool: "shot_set", input: { scene: "s", ...last } },
      };
    },
  },
  {
    id: "keyframe_set",
    tool: "keyframe_set",
    handles: ["keyframe"],
    plan: (v) => ({
      arrange: [
        add({ kind: "rect", id: "k" }),
        ...(v.before ?? []).map((kf) => ({
          tool: "keyframe_set",
          input: { scene: "s", id: "k", ...kf },
        })),
      ],
      call: {
        tool: "keyframe_set",
        input: { scene: "s", id: "k", ...v.keyframe },
      },
    }),
  },
  {
    id: "background_set",
    tool: "background_set",
    handles: ["background"],
    plan: (v) => ({
      arrange: [],
      call: {
        tool: "background_set",
        input: { scene: "s", patch: v.background },
      },
    }),
  },
  {
    id: "element_group",
    tool: "element_group",
    handles: ["group"],
    plan: (v) => {
      if (!v.group) return undefined;
      return {
        arrange: v.group.members.map((id) => add({ kind: "rect", id })),
        call: {
          tool: "element_group",
          input: { scene: "s", ids: v.group.members, id: v.group.id },
        },
      };
    },
  },
];

/** The key a cell has in `NOT_CARRIED`. */
export const cellKey = (rule: Rule, v: Violation) => `${rule.id} — ${v.label}`;

/**
 * Cells a writer handles but cannot carry, with the reason (`writer id` → `cellKey` → why).
 */
export const NOT_CARRIED: Record<string, Record<string, string>> = {
  scene_update: {
    "an element off the canvas gets a notice — rect":
      "a symbol's body is drawn where a `use` places it, not on the canvas",
    "a `use` names a symbol that exists — missing symbol":
      "scene_update fills symbol bodies; a `use` placed on the scene is not in its input",
    "a `use` override names a child its symbol has — override":
      "scene_update fills symbol bodies; a `use` placed on the scene is not in its input",
  },
  "scene_validate (compact)": {
    "an id can be addressed by a tool — empty element id":
      "in the compact form an empty id is an id left out, so one is generated",
  },
  scene_build: {
    "an id can be addressed by a tool — empty element id":
      "in the compact form an empty id is an id left out, so one is generated",
  },
  element_update: {
    "an id can be addressed by a tool — empty element id":
      "an update never changes an id, so it cannot give a bad one",
    "an id can be addressed by a tool — element id with a slash":
      "an update never changes an id, so it cannot give a bad one",
    "element ids are unique — two at the root":
      "an update never changes an id, so it cannot repeat one",
    "element ids are unique — a group child repeats a root id":
      "an update never changes an id, so it cannot repeat one",
  },
  shot_set: {
    "shot ids are unique — two shots":
      "shot_set with an id the scene has updates that shot; it cannot repeat one",
  },
};

/**
 * Tools that save a scene (`effects` has `scene`) and are not in `WRITERS`, with the reason.
 * A tool with `effects: ["scene"]` that is in neither fails `matrix.test.ts`, so a new scene
 * writer has to be given an adapter or a reason.
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
};
