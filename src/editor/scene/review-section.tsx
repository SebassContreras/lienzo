/**
 * The scene inspector's "Revisión" section: the open scene's `scene_inspect_layout` diagnostics,
 * computed in the browser by the same `inspectLayout` (062/D11). Text is measured with canvas
 * here, so results are orientative next to the tool's. "Avisos" lists the same notices as
 * `scene_validate`, from the same `sceneNotices`; clicking one selects its element (063/D7).
 */
import { ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";
import type { Scene } from "../../model/model.ts";
import type { Face } from "../../service/font-check.ts";
import { inspectLayout, type LayoutDiagnostic } from "../../service/layout.ts";
import { sceneNotices } from "../../service/scene-notices.ts";
import { Section } from "../controls.tsx";

export function ReviewSection({
  scene,
  fonts,
  onSelect,
}: {
  scene: Scene;
  /** The usable font faces, as the editor loaded them. */
  fonts: readonly Face[];
  onSelect?: (id: string) => void;
}) {
  const notices = useMemo(
    () => sceneNotices(scene, scene, fonts),
    [scene, fonts],
  );
  const [review, setReview] = useState<{
    scene: Scene;
    found: LayoutDiagnostic[];
  }>();
  /** A review of an older version of the scene is no longer shown. */
  const found = review?.scene === scene ? review.found : undefined;
  return (
    <Section title="Revisión">
      {notices.length > 0 && <div className="hint">Avisos</div>}
      {notices.map((n) =>
        n.elementId && onSelect ? (
          <button
            type="button"
            key={n.message}
            className="hint notice"
            title="Seleccionar el elemento"
            onClick={() => onSelect(n.elementId as string)}
          >
            {n.message}
          </button>
        ) : (
          <div key={n.message} className="hint notice">
            {n.message}
          </div>
        ),
      )}
      <button
        type="button"
        title="Busca solapes de texto, elementos fuera del lienzo, conexiones rotas y bajo contraste"
        onClick={() => setReview({ scene, found: inspectLayout(scene) })}
      >
        <ScanSearch size={14} /> Revisar escena
      </button>
      {found?.length === 0 && <div className="hint">Sin problemas.</div>}
      {found?.map((d) => (
        <div key={`${d.code}-${d.elementId}-${d.t}`} className="hint">
          {d.t.toFixed(1)} s · {d.message}
        </div>
      ))}
      {found && (
        <div className="hint">
          Orientativo: el texto se mide en el navegador.
        </div>
      )}
    </Section>
  );
}
