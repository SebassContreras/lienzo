/**
 * References a scene write must not leave dangling (074/D1): a `shot` the scene lacks, an
 * icon lucide lacks and a line end attached to no element. Only elements the write changed
 * are checked, so a stored scene with an old problem can still be edited elsewhere. Pure.
 */
import { ICON_NAMES } from "../engine/icon-set.ts";
import { mapElementsDeep } from "../model/element-walk.ts";
import { closestKey } from "../model/ignored.ts";
import type { Element, Scene } from "../model/model.ts";
import { fail } from "./registry.ts";
import { changedSince, placedElements } from "./scene-changes.ts";

const fold = (name: string) => name.toLowerCase().replace(/[-_\s]/g, "");
const BY_FOLDED = new Map(ICON_NAMES.map((name) => [fold(name), name]));

/** The lucide name `name` means (`star`, `arrow-right` → `Star`, `ArrowRight`), else itself. */
export function canonicalIcon(name: string): string {
  return BY_FOLDED.get(fold(name)) ?? name;
}

/** `scene` with every icon name in lucide's own spelling. */
export function withCanonicalIcons(scene: Scene): Scene {
  const fix = (el: Element): Element =>
    el.kind === "icon" && canonicalIcon(el.icon) !== el.icon
      ? { ...el, icon: canonicalIcon(el.icon) }
      : el;
  const symbols = scene.symbols
    ? Object.fromEntries(
        Object.entries(scene.symbols).map(([k, s]) => [
          k,
          { ...s, children: mapElementsDeep(s.children, fix) },
        ]),
      )
    : undefined;
  return {
    ...scene,
    elements: mapElementsDeep(scene.elements, fix),
    ...(symbols ? { symbols } : {}),
  };
}

const list = (items: readonly string[]) =>
  items.length > 0 ? items.map((i) => `«${i}»`).join(", ") : "ninguno";

/** Fails on the first changed element naming a shot, icon or line target `scene` lacks. */
export function checkReferences(scene: Scene, previous?: Scene): void {
  const shots = (scene.shots ?? []).map((sh) => sh.id);
  const placed = placedElements(scene);
  const ids = new Set(placed.map(({ el }) => el.id));
  const changed = changedSince(previous);
  for (const { el, path } of placed.filter(({ el }) => changed(el))) {
    if (el.shot !== undefined && !shots.includes(el.shot))
      fail(
        "unknown_shot",
        `«${el.id}» está ligado a la toma «${el.shot}», que no existe (tomas: ${list(shots)}; créala con shot_set)`,
        `${path}.shot`,
      );
    if (el.kind === "icon" && !BY_FOLDED.has(fold(el.icon))) {
      const near = closestKey(el.icon, ICON_NAMES);
      fail(
        "unknown_icon",
        `«${el.id}»: no existe el icono «${el.icon}»` +
          (near ? `; ¿querías «${near}»?` : "") +
          " (nombres de lucide, p. ej. «Star», «ArrowRight»; véase lucide.dev/icons)",
        `${path}.icon`,
      );
    }
    if (el.kind === "line")
      for (const end of ["a", "b"] as const) {
        const attach = el[end].attach;
        if (attach && !ids.has(attach))
          fail(
            "unknown_target",
            `«${el.id}»: el extremo ${end === "a" ? "inicial (from)" : "final (to)"} se conecta a «${attach}», que no existe (ids: ${list([...ids].filter((id) => id !== el.id))})`,
            `${path}.${end}.attach`,
          );
      }
  }
}
