/**
 * Generates the PWA icon set from code, so every binary in public/icons has a
 * reproducible origin (no untraceable image assets in the repository).
 *
 * Run: node apps/web/scripts/make-icons.mjs
 * The output is committed; this script only needs to run when the mark changes.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

/** Brand colours, kept in step with --accent in app/globals.css. */
const ACCENT = [31, 58, 95];
const WHITE = [255, 255, 255];

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** Encodes RGBA pixels as a PNG (8-bit, no interlace, filter 0 per scanline). */
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Coverage of a rounded rectangle at (x, y), antialiased over one pixel. */
function roundedRectCoverage(x, y, size, radius) {
  const inset = 0;
  const min = inset + radius;
  const max = size - inset - radius;
  const dx = x < min ? min - x : x > max ? x - max : 0;
  const dy = y < min ? min - y : y > max ? y - max : 0;
  const dist = Math.hypot(dx, dy) - radius;
  return clamp01(0.5 - dist);
}

/** Distance from a point to a line segment. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : clamp01((wx * vx + wy * vy) / len2);
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

/**
 * The mark: a forward chevron, for "go". `scale` is the share of the canvas the
 * mark occupies, so the maskable variant can keep the mark inside the safe zone.
 */
function markCoverage(x, y, size, scale) {
  const c = size / 2;
  const w = size * 0.20 * scale;
  const h = size * 0.30 * scale;
  const stroke = size * 0.085 * scale;
  const d = Math.min(
    distanceToSegment(x, y, c - w, c - h, c + w * 0.9, c),
    distanceToSegment(x, y, c + w * 0.9, c, c - w, c + h),
  );
  return clamp01(stroke / 2 + 0.5 - d);
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  // A maskable icon is full-bleed: the platform applies its own shape.
  const radius = maskable ? 0 : size * 0.2237;
  // Keep the mark inside the maskable safe zone (the inner 80% circle).
  const markScale = maskable ? 0.78 : 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const bg = maskable ? 1 : roundedRectCoverage(px, py, size, radius);
      const mark = markCoverage(px, py, size, markScale);
      const i = (y * size + x) * 4;
      // The white mark is composited over the accent background, then the whole
      // tile is masked by the background shape so corners stay transparent.
      for (let ch = 0; ch < 3; ch++) rgba[i + ch] = Math.round(ACCENT[ch] * (1 - mark) + WHITE[ch] * mark);
      rgba[i + 3] = Math.round(255 * bg);
    }
  }
  return png(size, size, rgba);
}

mkdirSync(OUT, { recursive: true });
const files = [
  ["icon-192.png", render(192, { maskable: false })],
  ["icon-512.png", render(512, { maskable: false })],
  ["icon-maskable-512.png", render(512, { maskable: true })],
  ["apple-touch-icon.png", render(180, { maskable: true })],
];
for (const [name, data] of files) {
  writeFileSync(join(OUT, name), data);
  console.log(`${name} ${data.length} bytes`);
}
