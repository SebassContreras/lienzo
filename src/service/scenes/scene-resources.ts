/**
 * What a scene names but cannot draw yet, without being wrong (069/D8, 074/D1): an asset
 * the project lacks (drawn as a placeholder until it is added, or audio that does not play,
 * 080/D3) and a line end whose element this write removed. Unknown shots, icons and targets fail instead (`checkReferences`).
 */
import { descriptorOf } from "../../components/index.ts";
import type { Scene } from "../../model/model.ts";
import { audioRefs, EXTERNAL_REF } from "../assets/asset-refs.ts";
import type { ProjectCtx } from "../core/ctx.ts";
import { allElements, changedSince, idsOf } from "./scene-changes.ts";

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
    // a symbol this write removed while a `use` still names it (078/D3)
    if (
      el.kind === "use" &&
      !scene.symbols?.[el.symbol] &&
      previous?.symbols?.[el.symbol]
    )
      notices.add(
        `«${el.id}» usa el símbolo «${el.symbol}», que se quitó; no dibuja nada`,
      );
    if (!changed(el)) continue;
    const refs = descriptorOf(el.kind)?.assets?.(el as never) ?? [];
    for (const ref of refs) {
      if (!ref || EXTERNAL_REF.test(ref)) continue;
      const check = await ctx.projects.checkAsset(ctx.project, ref);
      if (!check.ok && check.warning)
        notices.add(`«${el.id}»: ${check.warning}; se dibuja un marcador`);
    }
  }
  // audio the write changed (080/D3), as element assets are checked
  const heard = new Set(audioRefs(previous));
  for (const ref of audioRefs(scene)) {
    if (heard.has(ref) || EXTERNAL_REF.test(ref)) continue;
    const check = await ctx.projects.checkAsset(ctx.project, ref);
    if (!check.ok && check.warning)
      notices.add(`Audio «${ref}»: ${check.warning}; no sonará`);
  }
  return [...notices];
}
