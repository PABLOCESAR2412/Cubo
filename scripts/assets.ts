import { mkdir } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { file, write } from "bun";

function join(parts: Uint8Array[]): Uint8Array {
  const data = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    data.set(part, at);
    at += part.length;
  }
  return data;
}
function crc(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
function uint(value: number): Uint8Array {
  const data = new Uint8Array(4);
  new DataView(data.buffer).setUint32(0, value);
  return data;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const name = new TextEncoder().encode(type);
  return join([uint(data.length), name, data, uint(crc(join([name, data])))]);
}
const lines = [
  [32, 12, 50, 22],
  [50, 22, 50, 42],
  [50, 42, 32, 52],
  [32, 52, 14, 42],
  [14, 42, 14, 22],
  [14, 22, 32, 12],
  [14, 22, 32, 32],
  [32, 32, 50, 22],
  [32, 32, 32, 52],
];
function icon(size: number): Uint8Array {
  const raw = new Uint8Array(size * (size * 3 + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (x * 64) / size,
        py = (y * 64) / size;
      const stroke = lines.some(([ax, ay, bx, by]) => {
        if (ax === undefined || ay === undefined || bx === undefined || by === undefined)
          return false;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2),
          ),
        );
        return Math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay)) < 1.5;
      });
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      raw.set(stroke ? [217, 237, 145] : [16, 20, 22], offset);
    }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  header[8] = 8;
  header[9] = 2;
  return join([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk(
      "tEXt",
      new TextEncoder().encode(
        "impeccable:prompt\u0000Origin: Cubo authored geometric cube icon. Generated deterministically by scripts/assets.ts from nine line segments, lime #d9ed91 on charcoal #101416; no AI image generation.",
      ),
    ),
    chunk("IDAT", new Uint8Array(deflateSync(raw))),
    chunk("IEND", new Uint8Array()),
  ]);
}
await mkdir("apps/web/public/fonts", { recursive: true });
for (const size of [192, 512]) await write(`apps/web/public/icon-${size}.png`, icon(size));
await write(
  "apps/web/public/fonts/geist-latin.woff2",
  file("apps/web/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"),
);
await write(
  "apps/web/public/fonts/LICENSE.txt",
  file("apps/web/node_modules/@fontsource-variable/geist/LICENSE"),
);
