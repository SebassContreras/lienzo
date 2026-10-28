/**
 * The closed sets a caller picks from (081/D12), as text for tool descriptions, built from the
 * constants the schemas use so a description cannot drift from what fails.
 */
import { ALL_ANIMS } from "../components/fields/anim.ts";
import { EASING_NAMES } from "../engine/easing.ts";
import { TRANSITION_KINDS } from "./schema.ts";

const list = (names: readonly string[]) => names.map((n) => `\`${n}\``).join(", ");

/** Animation kinds, easings and shot transitions, as one paragraph. */
export const OPTIONS_TEXT =
  `Options: animation \`in\`/\`out\` kinds ${list(ALL_ANIMS.motions)}; \`loop\` kinds ` +
  `${list(ALL_ANIMS.loops)}; easings ${list(EASING_NAMES)} or \`cubic-bezier(x1, y1, x2, y2)\`; ` +
  `shot transitions ${list(TRANSITION_KINDS)}. `;
