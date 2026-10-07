import { defineTrait } from "./trait.ts";

/** Removes a rectangle's drop shadow. */
export const noShadow = defineTrait({
  id: "no-shadow",
  label: "Sin sombra",
  params: {},
  apply: {
    shape: (el) => {
      el.shadow.enabled = false;
    },
  },
});
