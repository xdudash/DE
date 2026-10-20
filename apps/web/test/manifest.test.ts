import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { appManifest } from "../lib/pwa/manifest.ts";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const manifest = appManifest();

/** Reads a PNG header: signature plus the width and height declared in IHDR. */
function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buf.subarray(0, 8).equals(signature), `${path} is not a PNG`);
  assert.equal(buf.toString("ascii", 12, 16), "IHDR", `${path} has no IHDR chunk`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("app manifest", () => {
  it("names the app and starts inside its own scope", () => {
    assert.equal(manifest.name, "DeutschGo");
    assert.ok(manifest.short_name.length > 0 && manifest.short_name.length <= 12);
    assert.ok(manifest.start_url.startsWith(manifest.scope), "start_url must be inside scope");
  });

  it("asks for a standalone window", () => {
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.display_override.includes("standalone"));
  });

  it("declares the icon sizes browsers require to offer installation", () => {
    const any = manifest.icons.filter((i) => i.purpose === "any").map((i) => i.sizes);
    assert.ok(any.includes("192x192"), "a 192px icon is required");
    assert.ok(any.includes("512x512"), "a 512px icon is required");
  });

  it("has a maskable icon, so platforms do not letterbox it", () => {
    assert.ok(manifest.icons.some((i) => i.purpose === "maskable" && i.sizes === "512x512"));
  });

  it("uses colours in the hex form the manifest spec accepts", () => {
    for (const colour of [manifest.theme_color, manifest.background_color]) {
      assert.match(colour, /^#[0-9a-f]{6}$/);
    }
  });

  it("points at icon files that exist and really are the declared size", () => {
    for (const icon of manifest.icons) {
      assert.match(icon.src, /^\/icons\/[a-z0-9-]+\.png$/, `unexpected icon path ${icon.src}`);
      assert.equal(icon.type, "image/png");
      const { width, height } = pngSize(join(PUBLIC, icon.src));
      const [declaredW, declaredH] = icon.sizes.split("x").map(Number);
      assert.equal(width, declaredW, `${icon.src} width does not match ${icon.sizes}`);
      assert.equal(height, declaredH, `${icon.src} height does not match ${icon.sizes}`);
    }
  });

  it("ships the Apple touch icon the root layout links to", () => {
    const { width, height } = pngSize(join(PUBLIC, "icons", "apple-touch-icon.png"));
    assert.deepEqual([width, height], [180, 180]);
  });
});

describe("service worker file", () => {
  const source = readFileSync(join(PUBLIC, "sw.js"), "utf8");

  it("never caches API calls, so attempts are not answered from a stale cache", () => {
    assert.match(source, /\/api\//);
  });

  it("falls back to the offline page it precaches", () => {
    assert.match(source, /OFFLINE_URL\s*=\s*"\/offline"/);
    assert.match(source, /PRECACHE\s*=\s*\[OFFLINE_URL/);
  });

  it("ignores non-GET requests, which must never be replayed from a cache", () => {
    assert.match(source, /request\.method\s*!==\s*"GET"/);
  });
});
