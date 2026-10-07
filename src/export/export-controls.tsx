import { Download } from "lucide-react";
import { useState } from "react";
import type { Scene } from "../model/model.ts";
import { download, type ExportFormat, exportScene } from "./export.ts";

/** Format and size pickers plus the export button of the top bar. */
export function ExportControls({
  scene,
  time,
  fileName,
  setStatus,
}: {
  scene: Scene;
  /** Current playhead, used for the PNG still. */
  time: () => number;
  fileName: string;
  setStatus: (s: string) => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const fps = format === "gif" ? Math.min(scene.fps, 25) : scene.fps;
      const blob = await exportScene(
        scene,
        { format, scale, fps, time: time() },
        (done, total) => setStatus(`Exportando ${done}/${total}…`),
      );
      const ext =
        format === "mp4" && blob.type === "video/webm" ? "webm" : format;
      download(blob, `${fileName}.${ext}`);
      setStatus(
        `Exportado ${fileName}.${ext} (${(blob.size / 1024 / 1024).toFixed(1)} MB)`,
      );
    } catch (error) {
      setStatus(`Error al exportar: ${error}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group">
      <select
        aria-label="Formato"
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
      >
        <option value="png">PNG (cuadro actual)</option>
        <option value="gif">GIF (loop)</option>
        <option value="mp4">MP4 (loop)</option>
      </select>
      <select
        aria-label="Tamaño"
        value={scale}
        onChange={(e) => setScale(Number(e.target.value))}
      >
        <option value={1}>100%</option>
        <option value={0.75}>75%</option>
        <option value={0.5}>50%</option>
        <option value={0.25}>25%</option>
      </select>
      <button type="button" className="primary" disabled={busy} onClick={run}>
        <Download size={16} /> Exportar
      </button>
    </div>
  );
}
