/**
 * A picture's size from its first bytes (069/D8, D14): enough to tell a real PNG, JPEG,
 * WebP or SVG from a renamed file, and to give an image element its aspect, without a
 * browser. Pure: bytes in, size out.
 */

export type ImageSize = { width: number; height: number };

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const starts = (b: Uint8Array, sig: readonly number[], at = 0) =>
  sig.every((v, i) => b[at + i] === v);

const ascii = (b: Uint8Array, at: number, n: number) =>
  String.fromCharCode(...b.subarray(at, at + n));

function png(b: Uint8Array, v: DataView): ImageSize | undefined {
  if (!starts(b, PNG) || ascii(b, 12, 4) !== "IHDR") return undefined;
  return { width: v.getUint32(16), height: v.getUint32(20) };
}

function jpeg(b: Uint8Array, v: DataView): ImageSize | undefined {
  if (!starts(b, [0xff, 0xd8])) return undefined;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return undefined;
    const marker = b[i + 1] as number;
    // SOF0–SOF15 hold the size, except DHT (C4), JPG (C8) and DAC (CC)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    )
      return { height: v.getUint16(i + 5), width: v.getUint16(i + 7) };
    i += 2 + v.getUint16(i + 2);
  }
  return undefined;
}

function webp(b: Uint8Array, v: DataView): ImageSize | undefined {
  if (ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return undefined;
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8 ")
    return {
      width: v.getUint16(26, true) & 0x3fff,
      height: v.getUint16(28, true) & 0x3fff,
    };
  if (chunk === "VP8L") {
    const bits = v.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X")
    return {
      width:
        1 +
        ((b[24] as number) |
          ((b[25] as number) << 8) |
          ((b[26] as number) << 16)),
      height:
        1 +
        ((b[27] as number) |
          ((b[28] as number) << 8) |
          ((b[29] as number) << 16)),
    };
  return undefined;
}

/** An SVG's size from `width`/`height`, else its `viewBox`; 0×0 when it states neither. */
function svg(b: Uint8Array): ImageSize | undefined {
  const text = new TextDecoder().decode(b.subarray(0, 4096));
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0];
  if (!tag) return undefined;
  const attr = (name: string) =>
    new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, "i").exec(tag)?.[1];
  const width = Number.parseFloat(attr("width") ?? "");
  const height = Number.parseFloat(attr("height") ?? "");
  if (width > 0 && height > 0) return { width, height };
  const box = attr("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    box &&
    box.length === 4 &&
    (box[2] as number) > 0 &&
    (box[3] as number) > 0
  )
    return { width: box[2] as number, height: box[3] as number };
  return { width: 0, height: 0 };
}

/** The size of the picture in `bytes`, or undefined when they are not a PNG, JPEG, WebP or SVG. */
export function imageSize(bytes: Uint8Array): ImageSize | undefined {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 16) return svg(bytes);
  try {
    return png(bytes, v) ?? jpeg(bytes, v) ?? webp(bytes, v) ?? svg(bytes);
  } catch {
    return undefined; // a truncated header reads past the end
  }
}

/** Whether files of extension `ext` are pictures `imageSize` reads. */
export const isImageExtension = (ext: string) =>
  ["png", "jpg", "jpeg", "webp", "svg"].includes(ext);
