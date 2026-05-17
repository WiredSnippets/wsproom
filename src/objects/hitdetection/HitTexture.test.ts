import { HitTexture } from "./HitTexture";

// 2x2 image:
// pixel (0,0) = opaque (bit 0 set)
// pixel (1,0) = transparent (bit 1 not set)
// pixel (0,1) = transparent (bit 2 not set)
// pixel (1,1) = opaque (bit 3 set)
// hitmap[0] = 0b1001 = 9
function makeHitmap(): Uint32Array {
  const hitmap = new Uint32Array(1);
  hitmap[0] = (1 << 0) | (1 << 3); // pixels 0 and 3 are hit
  return hitmap;
}

test("detects first pixel", () => {
  const texture = HitTexture.fromHitmap(makeHitmap(), 2, 2);
  expect(texture.hits(0, 0, { x: 0, y: 0 })).toBe(true);
});

test("doesn't detect second pixel", () => {
  const texture = HitTexture.fromHitmap(makeHitmap(), 2, 2);
  expect(texture.hits(1, 0, { x: 0, y: 0 })).toBe(false);
});

test("detects multiple pixels", () => {
  const texture = HitTexture.fromHitmap(makeHitmap(), 2, 2);
  expect(texture.hits(0, 1, { x: 0, y: 0 })).toBe(false);
  expect(texture.hits(1, 1, { x: 0, y: 0 })).toBe(true);
});
