/**
 * The scene inspector's "Revisión" section: the open scene's `scene_inspect_layout` diagnostics,
 * computed in the browser by the same `inspectLayout` (062/D11). Text is measured with canvas
 * here, so results are orientative next to the tool's.
 */
import { ScanSearch } from "lucide-react";
import { useState } from "react";
import type { Scene } from "../../model/model.ts";
import { inspectLayout, type LayoutDiagnostic } from "../../service/layout.ts";
import { Section } from "../controls.tsx";

export function ReviewSection({ scene }: { scene: Scene }) {
  const [review, setReview] = useState<{
    scene: Scene;
    found: LayoutDiagnostic[];
  }>();
  /** A review of an older version of the scene is no longer shown. */
  const found = review?.scene === scene ? review.found : undefined;
  return (
    <Section title="Revisión">
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
