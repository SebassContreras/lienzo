/**
 * 049/T007 in a real headless browser: the probe decodes a PNG with a transparent margin and
 * finds its visible pixels with the editor's `alphaBounds`. Skipped where no Chrome, Edge or
 * Playwright Chromium is installed.
 */
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import { chromium } from "playwright-core";
import { afterAll, describe, expect, it } from "vitest";
import { createBrowserImageProbe } from "./image-probe.ts";

const APP_ROOT = join(import.meta.dirname, "..", "..");

async function hasBrowser(): Promise<boolean> {
  for (const channel of ["chrome", "msedge", undefined]) {
    const b = await chromium.launch({ channel }).catch(() => undefined);
    if (b) {
      await b.close();
      return true;
    }
  }
  return false;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** A `size`×`size` RGBA PNG, transparent but for an opaque red square from `from` to `to`. */
function marginPng(size: number, from: number, to: number): string {
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = from; y <= to; y++) {
    for (let x = from; x <= to; x++) {
      const at = y * (1 + size * 4) + 1 + x * 4;
      rows[at] = 255;
      rows[at + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

const browser = await hasBrowser();

describe.skipIf(!browser)(
  "browser image probe (049)",
  { timeout: 180_000 },
  () => {
    const probe = createBrowserImageProbe(APP_ROOT);
    afterAll(() => probe.dispose());

    it("finds the visible pixels inside a transparent margin", async () => {
      const src = marginPng(10, 2, 7);

      const bounds = await probe.opaqueBounds(src);

      expect(bounds).toEqual({ x: 0.2, y: 0.2, w: 0.6, h: 0.6 });
    });

    it("rejects a picture it cannot decode", async () => {
      const src = "data:image/png;base64,bm90IGEgcG5n";

      await expect(probe.opaqueBounds(src)).rejects.toThrow();
    });
  },
);
