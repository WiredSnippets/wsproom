import { getLandscapeItemPosition } from "./Landscape";

const item = (over: Partial<Parameters<typeof getLandscapeItemPosition>[0]>) => ({
  asset: "cloud",
  x: 0,
  y: 0,
  speedX: 0,
  speedY: 0,
  ...over,
});

// A 10 tile wide landscape, one wall high.
const SPAN = 10 * 32;
const HEIGHT = 116;

test("a still item stays where its normalised position puts it", () => {
  expect(getLandscapeItemPosition(item({ x: 0.5, y: 0.25 }), SPAN, HEIGHT, 9999))
    .toEqual({ x: SPAN / 2, y: 29 });
});

test("speed is room units per second, so one span takes span/speed seconds", () => {
  // 10 tiles wide, 10 tiles per second => a full lap every second.
  const drifting = item({ speedX: 10 });

  expect(getLandscapeItemPosition(drifting, SPAN, HEIGHT, 500).x).toBe(SPAN / 2);
  expect(getLandscapeItemPosition(drifting, SPAN, HEIGHT, 1000).x).toBe(0);
  expect(getLandscapeItemPosition(drifting, SPAN, HEIGHT, 1500).x).toBe(SPAN / 2);
});

test("an item keeps the same tiles-per-second in a bigger room", () => {
  const wide = 40 * 32;
  const drifting = item({ speedX: 10 });

  // Still 10 tiles a second, so a quarter of a 40 tile landscape.
  expect(getLandscapeItemPosition(drifting, wide, HEIGHT, 1000).x).toBe(10 * 32);
  expect(getLandscapeItemPosition(drifting, wide, HEIGHT, 4000).x).toBe(0);
});

test("items drifting backwards wrap round instead of running off", () => {
  const drifting = item({ x: 0.1, speedX: -10 });

  // 0.1 - 0.2 = -0.1, which is 0.9 of the way along, not off the left edge.
  const { x } = getLandscapeItemPosition(drifting, SPAN, HEIGHT, 200);
  expect(x).toBeGreaterThanOrEqual(0);
  expect(x).toBe(Math.trunc(0.9 * SPAN));
});

test("vertical drift is scaled by the wall height, not the width", () => {
  const rising = item({ speedY: HEIGHT / 32 });

  expect(getLandscapeItemPosition(rising, SPAN, HEIGHT, 1000).y).toBe(0);
  expect(getLandscapeItemPosition(rising, SPAN, HEIGHT, 500).y).toBe(
    Math.trunc(0.5 * HEIGHT)
  );
});
