/**
 * The shared rules of a scene (082/D6): each one is a content that breaks it, written once, and
 * the message every writer must give. `writers.ts` says how each writer carries the content;
 * `matrix.test.ts` checks every rule in every writer.
 */

type Fields = Record<string, unknown>;

/** Scene content that breaks one rule. */
export type Violation = {
  /** Shots the scene has before the broken content arrives. */
  shots?: Fields[];
  /** The elements, in the form a scene stores them (`id` and `kind` given). */
  elements?: Fields[];
  /** The same elements in the compact form, where it differs. */
  compactElements?: Fields[];
  /** Scene fields (`fps`, `width`…) the broken content sets. */
  scene?: Fields;
  /** A background patch. */
  background?: Fields;
};

export type Rule = {
  id: string;
  /** What every writer's message says. */
  message: RegExp;
  violation: Violation;
};

const SHOT = { id: "s1", start: 0, end: 2 };

export const RULES: readonly Rule[] = [
  {
    id: "an element's shot exists",
    message: /«nope».*«s1»/,
    violation: {
      shots: [SHOT],
      elements: [{ id: "x", kind: "rect", shot: "nope" }],
    },
  },
  {
    id: "element ids are unique",
    message: /ID duplicado «x»/,
    violation: {
      elements: [
        { id: "x", kind: "rect" },
        { id: "x", kind: "text" },
      ],
    },
  },
  {
    id: "an opacity is a fraction",
    message: /Demasiado grande/,
    violation: { elements: [{ id: "x", kind: "rect", opacity: 2 }] },
  },
];
