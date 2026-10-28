/**
 * The shared rules of a scene (082/D6): each one is a content that breaks it, written once, and
 * the message every writer must give. `writers.ts` says how each writer carries the content;
 * `matrix.test.ts` checks every rule in every writer.
 */

type Fields = Record<string, unknown>;

/** Scene content that breaks one rule: the keys say which kind of content it is. */
export type Violation = {
  /** What is broken, for the test's name. */
  label: string;
  /** Shots the scene has before the broken content arrives. */
  shots?: Fields[];
  /** The scene's shots, which are the broken content. */
  shotContent?: Fields[];
  /** The elements, in the form a scene stores them (`id` and `kind` given). */
  elements?: Fields[];
  /** The same elements in the compact form, where it differs. */
  compactElements?: Fields[];
  /** Scene fields (`fps`, `width`…) the broken content sets. */
  scene?: Fields;
  /** A background patch. */
  background?: Fields;
  /** Keyframes set on the element's track before the broken one. */
  before?: Fields[];
  /** A keyframe set on an element's track. */
  keyframe?: Fields;
  /** The content is about where it sits on the canvas, so a writer that does not place it skips it. */
  onCanvas?: boolean;
  /** Existing elements grouped under an `id`. */
  group?: { members: string[]; id: string };
};

export type Rule = {
  id: string;
  /** Whether the writer refuses the content or accepts it with a notice. */
  outcome: "refused" | "notice";
  /** What every writer's message says. */
  message: RegExp;
  violations: Violation[];
};

const SHOT = { id: "s1", start: 0, end: 2 };
const TOO_BIG = /Demasiado grande/;
const UNKNOWN_EASING = /easing desconocido.*ease-out/;

export const RULES: readonly Rule[] = [
  {
    id: "an element's shot exists",
    outcome: "refused",
    message: /«nope».*«s1»/,
    violations: [
      {
        label: "element",
        shots: [SHOT],
        elements: [{ id: "x", kind: "rect", shot: "nope" }],
      },
    ],
  },
  {
    id: "element ids are unique",
    outcome: "refused",
    message: /ID duplicado «x»/,
    violations: [
      {
        label: "two at the root",
        elements: [
          { id: "x", kind: "rect" },
          { id: "x", kind: "text" },
        ],
      },
      {
        label: "a group child repeats a root id",
        elements: [
          { id: "x", kind: "rect" },
          { id: "g", kind: "group", children: [{ id: "x", kind: "text" }] },
        ],
      },
    ],
  },
  {
    id: "a group's id is not taken",
    outcome: "refused",
    message: /«r1»/,
    violations: [
      { label: "grouping", group: { members: ["r1", "r2"], id: "r1" } },
    ],
  },
  {
    id: "an opacity is a fraction",
    outcome: "refused",
    message: TOO_BIG,
    violations: [
      { label: "element", elements: [{ id: "x", kind: "rect", opacity: 2 }] },
    ],
  },
  {
    id: "an icon exists",
    outcome: "refused",
    message: /«Wrenchh».*«Wrench»/,
    violations: [
      {
        label: "element",
        elements: [{ id: "x", kind: "icon", icon: "Wrenchh" }],
      },
    ],
  },
  {
    id: "a line end attaches to an element that exists",
    outcome: "refused",
    message: /«fantasma».*«r»/,
    violations: [
      {
        label: "element",
        elements: [
          { id: "r", kind: "rect" },
          { id: "x", kind: "line", b: { x: 0, y: 0, attach: "fantasma" } },
        ],
        compactElements: [
          { id: "r", kind: "rect" },
          { id: "x", kind: "line", to: "fantasma" },
        ],
      },
    ],
  },
  {
    id: "an easing is one the engine has",
    outcome: "refused",
    message: UNKNOWN_EASING,
    violations: [
      {
        label: "element track",
        elements: [
          { id: "x", kind: "rect", tracks: { x: [[0, 0, "wobbly"]] } },
        ],
      },
      {
        label: "keyframe",
        keyframe: { path: "x", t: 1, value: 5, easing: "wobbly" },
      },
      {
        label: "camera track",
        shotContent: [
          { ...SHOT, camera: { tracks: { zoom: [[0, 1, "wobbly"]] } } },
        ],
      },
    ],
  },
  {
    id: "a shot lasts",
    outcome: "refused",
    message: /no dura/,
    violations: [
      {
        label: "start equals end",
        shotContent: [{ id: "s1", start: 2, end: 2 }],
      },
    ],
  },
  {
    id: "a shot ends within the scene",
    outcome: "refused",
    message: /después de la escena/,
    violations: [
      {
        label: "end past the duration",
        shotContent: [{ id: "s1", start: 0, end: 500 }],
      },
    ],
  },
  {
    id: "shots do not overlap",
    outcome: "refused",
    message: /se solapa con/,
    violations: [
      {
        label: "two shots",
        shotContent: [SHOT, { id: "s2", start: 1, end: 3 }],
      },
    ],
  },
  {
    id: "shot ids are unique",
    outcome: "refused",
    message: /dos tomas con el id «s1»/,
    violations: [
      {
        label: "two shots",
        shotContent: [SHOT, { id: "s1", start: 3, end: 4 }],
      },
    ],
  },
  {
    id: "fps is at most 60",
    outcome: "refused",
    message: TOO_BIG,
    violations: [{ label: "500", scene: { fps: 500 } }],
  },
  {
    id: "a side is at most 7680 pixels",
    outcome: "refused",
    message: TOO_BIG,
    violations: [{ label: "20000", scene: { width: 20000 } }],
  },
  {
    id: "duration is at most 600 seconds",
    outcome: "refused",
    message: TOO_BIG,
    violations: [{ label: "100000", scene: { duration: 100000 } }],
  },
  {
    id: "a background spotlight is a fraction",
    outcome: "refused",
    message: TOO_BIG,
    violations: [{ label: "7", background: { spotlight: 7 } }],
  },
  {
    id: "a font that is not installed gets a notice",
    outcome: "notice",
    message: /«Nope Sans» no está instalada/,
    violations: [
      {
        label: "text",
        elements: [{ id: "x", kind: "text", font: "Nope Sans" }],
      },
    ],
  },
  {
    id: "an easing on a track's last keyframe gets a notice",
    outcome: "notice",
    message: /easing «ease-out» en su último keyframe/,
    violations: [
      {
        label: "element track",
        elements: [
          {
            id: "x",
            kind: "rect",
            tracks: {
              x: [
                [0, 0],
                [1, 5, "ease-out"],
              ],
            },
          },
        ],
      },
      {
        label: "keyframe",
        before: [{ path: "x", t: 0, value: 0 }],
        keyframe: { path: "x", t: 1, value: 5, easing: "ease-out" },
      },
      {
        label: "camera track",
        shotContent: [
          {
            ...SHOT,
            camera: {
              tracks: {
                zoom: [
                  [0, 1],
                  [1, 1.2, "ease-out"],
                ],
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: "a camera track on a channel the camera lacks gets a notice",
    outcome: "notice",
    message: /no tiene la pista «rotation»/,
    violations: [
      {
        label: "rotation",
        shotContent: [
          {
            ...SHOT,
            camera: {
              tracks: {
                rotation: [
                  [0, 0],
                  [1, 1],
                ],
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: "a transition longer than its shot gets a notice",
    outcome: "notice",
    message: /se solapa con las tomas vecinas/,
    violations: [
      {
        label: "five seconds in two",
        shotContent: [{ ...SHOT, transition: { kind: "fade", duration: 5 } }],
      },
    ],
  },
  {
    id: "an element off the canvas gets a notice",
    outcome: "notice",
    message: /se sale del lienzo/,
    violations: [
      {
        label: "rect",
        onCanvas: true,
        elements: [{ id: "x", kind: "rect", x: 5000, y: 5000, w: 10, h: 10 }],
      },
    ],
  },
];
