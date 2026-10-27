/**
 * Resources a scene names but cannot draw (069/D8): an icon name lucide lacks, an asset the
 * project lacks (both drawn as placeholders) and a line end attached to no element, so every
 * scene write says so.
 */
import { descriptorOf } from "../components/index.ts";
import { ICON_NAMES } from "../engine/icon-set.ts";
import { mapElementsDeep } from "../model/element-walk.ts";
import type { Element, Scene } from "../model/model.ts";
import type { ProjectCtx } from "./ctx.ts";

const ICONS = new Set(ICON_NAMES);

/** References that are not project files: web and inline images. */
const EXTERNAL = /^(?:https?:|data:|blob:)/i;

/** Every element of `scene`, group children and symbol children included. */
function allElements(scene: Scene): Element[] {
  const out: Element[] = [];
  const collect = (el: Element) => {
    out.push(el);
    return el;
  };
  mapElementsDeep(scene.elements, collect);
  for (const symbol of Object.values(scene.symbols ?? {}))
    mapElementsDeep(symbol.children, collect);
  return out;
}

/** One notice per icon name or asset reference of `scene` that would draw as a placeholder. */
export async function resourceNotices(
  ctx: ProjectCtx,
  scene: Scene,
): Promise<string[]> {
  const notices = new Set<string>();
  const elements = allElements(scene);
  const ids = new Set(elements.map((el) => el.id));
  for (const el of elements) {
    if (el.kind === "line")
      for (const [end, label] of [
        ["a", "inicial (from)"],
        ["b", "final (to)"],
      ] as const) {
        const attach = el[end].attach;
        if (attach && !ids.has(attach))
          notices.add(
            `«${el.id}»: el extremo ${label} se conecta a «${attach}», que no existe; queda suelto`,
          );
      }
    if (el.kind === "icon" && !ICONS.has(el.icon))
      notices.add(
        `«${el.id}»: no existe el icono «${el.icon}» (nombres de lucide en PascalCase, p. ej. «Wrench»); se dibuja vacío`,
      );
    const refs = descriptorOf(el.kind)?.assets?.(el as never) ?? [];
    for (const ref of refs) {
      if (!ref || EXTERNAL.test(ref)) continue;
      const check = await ctx.projects.checkAsset(ctx.project, ref);
      if (!check.ok && check.warning)
        notices.add(`«${el.id}»: ${check.warning}; se dibuja un marcador`);
    }
  }
  return [...notices];
}
