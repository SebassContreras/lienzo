/**
 * References a scene write must not leave dangling (074/D1): a `shot` the scene lacks, an
 * icon lucide lacks, a line end attached to no element and a `use` of a missing symbol (078/D3). Only elements the write changed
 * are checked, so a stored scene with an old problem can still be edited elsewhere; a `use` also
 * counts as changed when the symbol it names was removed or changed. Pure.
 */

import { trackPaths } from "../../components/descriptor.ts";
import { descriptorOf } from "../../components/index.ts";
import { ICON_NAMES } from "../../engine/icon-set.ts";
import { mapElementsDeep } from "../../model/element-walk.ts";
import { closestKey } from "../../model/ignored.ts";
import type { Element, Scene } from "../../model/model.ts";
import { failAll, type Problem } from "../core/registry.ts";
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

type Dangling = Problem & { code: string };

/** The ids of `elements` and everything inside them. */
const symbolIds = (elements: readonly Element[]): Set<string> =>
  new Set(
    elements.flatMap((el) => [
      el.id,
      ...(el.kind === "group" ? [...symbolIds(el.children)] : []),
    ]),
  );

/** The names of the symbols `scene` removed from `previous` or changed in it. */
function changedSymbolNames(scene: Scene, previous?: Scene): Set<string> {
  return new Set(
    Object.entries(previous?.symbols ?? {})
      .filter(
        ([name, body]) =>
          JSON.stringify(body) !== JSON.stringify(scene.symbols?.[name]),
      )
      .map(([name]) => name),
  );
}

/** Every changed element's reference to a shot, icon, line target or symbol `scene` lacks. */
export function danglingReferences(scene: Scene, previous?: Scene): Dangling[] {
  const shots = (scene.shots ?? []).map((sh) => sh.id);
  const symbols = Object.keys(scene.symbols ?? {});
  const placed = placedElements(scene);
  const ids = new Set(placed.map(({ el }) => el.id));
  const changed = changedSince(previous);
  const changedSymbols = changedSymbolNames(scene, previous);
  const out: Dangling[] = [];
  const checked = ({ el }: { el: Element }) =>
    changed(el) || (el.kind === "use" && changedSymbols.has(el.symbol));
  for (const { el, path } of placed.filter(checked)) {
    if (typeof el.shot === "string" && !shots.includes(el.shot))
      out.push({
        code: "unknown_shot",
        message: `Está ligado a la toma «${el.shot}», que no existe (tomas: ${list(shots)}; créala con shot_set)`,
        path: `${path}.shot`,
      });
    if (
      el.kind === "use" &&
      typeof el.symbol === "string" &&
      !symbols.includes(el.symbol)
    )
      out.push({
        code: "unknown_symbol",
        message: `Usa el símbolo «${el.symbol}», que no existe (símbolos: ${list(symbols)}; defínelo en \`symbols\`)`,
        path: `${path}.symbol`,
      });
    if (
      el.kind === "icon" &&
      typeof el.icon === "string" &&
      !BY_FOLDED.has(fold(el.icon))
    ) {
      const near = closestKey(el.icon, ICON_NAMES);
      out.push({
        code: "unknown_icon",
        message:
          `No existe el icono «${el.icon}»` +
          (near ? `; ¿querías «${near}»?` : "") +
          " (nombres de lucide, p. ej. «Star», «ArrowRight»; véase lucide.dev/icons)",
        path: `${path}.icon`,
      });
    }
    // a track on a path the kind cannot animate, and an override naming a child the symbol lacks (081/D8)
    const d = descriptorOf(el.kind);
    const animatable = d ? trackPaths(d) : [];
    for (const track of Object.keys(el.tracks ?? {}))
      if (d && !animatable.includes(track))
        out.push({
          code: "unknown_path",
          message: `«${track}» no se puede animar en «${el.kind}» (se puede: ${animatable.join(", ")})`,
          path: `${path}.tracks.${track}`,
        });
    if (el.kind === "use" && symbols.includes(el.symbol)) {
      const inside = symbolIds(scene.symbols?.[el.symbol]?.children ?? []);
      for (const key of Object.keys(el.overrides ?? {}))
        if (!inside.has(key) && !/^\d+(\.\d+)*$/.test(key))
          out.push({
            code: "unknown_override",
            message: `El símbolo «${el.symbol}» no tiene el elemento «${key}» (ids: ${list([...inside])})`,
            path: `${path}.overrides.${key}`,
          });
    }
    if (el.kind === "line")
      for (const end of ["a", "b"] as const) {
        const attach = (el[end] as { attach?: unknown } | undefined)?.attach;
        if (typeof attach === "string" && attach && !ids.has(attach))
          out.push({
            code: "unknown_target",
            message: `El extremo ${end === "a" ? "inicial (from)" : "final (to)"} se conecta a «${attach}», que no existe (ids: ${list([...ids].filter((id) => id !== el.id))})`,
            path: `${path}.${end}.attach`,
          });
      }
  }
  return out;
}

/** Fails listing every dangling reference of a changed element (074/D1). */
export function checkReferences(scene: Scene, previous?: Scene): void {
  const found = danglingReferences(scene, previous);
  if (found[0]) failAll(found[0].code, found);
}
