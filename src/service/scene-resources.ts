/**
 * What a scene names but cannot draw yet, without being wrong (069/D8, 074/D1): an asset
 * the project lacks (drawn as a placeholder until it is added) and a line end whose element
 * this write removed. Unknown shots, icons and targets fail instead (`checkReferences`).
 */
import { descriptorOf } from "../components/index.ts";
import type { Scene } from "../model/model.ts";
import type { ProjectCtx } from "./ctx.ts";
import { allElements, changedSince, idsOf } from "./scene-changes.ts";

/** References that are not project files: web and inline images. */
const EXTERNAL = /^(?:https?:|data:|blob:)/i;

/**
 * One notice per asset reference of a changed element that would draw as a placeholder, and
 * per line end left loose because the element it attached to was removed by this write.
 */
export async function resourceNotices(
  ctx: ProjectCtx,
  scene: Scene,
  previous?: Scene,
): Promise<string[]> {
  const notices = new Set<string>();
  const elements = allElements(scene);
  const ids = new Set(elements.map((el) => el.id));
  const before = idsOf(previous);
  const changed = changedSince(previous);
  for (const el of elements) {
    if (el.kind === "line")
      for (const [end, label] of [
        ["a", "inicial (from)"],
        ["b", "final (to)"],
      ] as const) {
        const attach = el[end].attach;
        if (attach && !ids.has(attach) && before.has(attach))
          notices.add(
            `«${el.id}»: el extremo ${label} se conectaba a «${attach}», que se quitó; queda suelto`,
          );
      }
    if (!changed(el)) continue;
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
