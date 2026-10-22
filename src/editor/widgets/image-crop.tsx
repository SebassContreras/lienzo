import { Crop as CropIcon, Maximize, Scissors } from "lucide-react";
import { useState } from "react";
import { FULL_CROP, type ImageEl } from "../../components/image/descriptor.ts";
import { imagePixels } from "../../engine/image-pixels.ts";
import { alphaBounds, applyCrop } from "../../engine/image-trim.ts";

const isFull = (el: ImageEl) =>
  el.crop.x === 0 && el.crop.y === 0 && el.crop.w === 1 && el.crop.h === 1;

/**
 * Trim, manual crop and remove crop for the selected image (048/D5). `onChange` receives the
 * cropped element; `onCropMode` opens the crop handles on the stage.
 */
export function ImageCropTools({
  el,
  onChange,
  onCropMode,
}: {
  el: ImageEl;
  onChange: (el: ImageEl) => void;
  onCropMode?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const trim = () => {
    setBusy(true);
    setMessage("");
    imagePixels(el.src)
      .then(({ data, width, height }) => {
        const bounds = alphaBounds(data, width, height);
        if (bounds) onChange(applyCrop(el, bounds));
        else setMessage("La imagen es transparente: no hay nada que recortar.");
      })
      .catch(() => setMessage("No se pudo leer la imagen."))
      .finally(() => setBusy(false));
  };

  if (!el.src) return null;
  return (
    <>
      <div className="crop-tools">
        <button type="button" disabled={busy} onClick={trim}>
          <Scissors size={15} />{" "}
          {busy ? "Recortando…" : "Recortar transparencia"}
        </button>
        {onCropMode && (
          <button
            type="button"
            title="También con doble clic sobre la imagen"
            onClick={onCropMode}
          >
            <CropIcon size={15} /> Recortar manualmente
          </button>
        )}
        {!isFull(el) && (
          <button
            type="button"
            onClick={() => onChange(applyCrop(el, FULL_CROP))}
          >
            <Maximize size={15} /> Quitar recorte
          </button>
        )}
      </div>
      {message && <div className="hint">{message}</div>}
    </>
  );
}
