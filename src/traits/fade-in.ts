import { defineTrait } from "./trait.ts";

/** Fades in once, starting at `delay` seconds. */
export const fadeIn = defineTrait({
  id: "fade-in",
  label: "Aparecer",
  params: { delay: 0 },
  apply: {
    shape: (el, p) => {
      el.anim = { ...el.anim, kind: "fade-in", delay: p.delay };
    },
    text: (el, p) => {
      el.anim = { ...el.anim, kind: "fade-in", delay: p.delay };
    },
    line: (el, p) => {
      el.anim = { ...el.anim, kind: "fade-in", delay: p.delay };
    },
  },
});
