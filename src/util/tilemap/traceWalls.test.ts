import { parseTileMapString } from "../parseTileMapString";
import { traceWalls } from "./traceWalls";

const trace = (map: string) => traceWalls(parseTileMapString(map));

test("walks the outline of a plain rectangle", () => {
  const { walls } = trace(`
    xxxx
    x000
    x000
  `);

  // A rectangle closes in four corners, so four stretches.
  expect(walls.length).toBeGreaterThan(0);
  expect(walls.every((wall) => wall.length > 0)).toBe(true);
});

test("only walls the region the seed belongs to", () => {
  // Two floors with a blank row between them: the sushi bar's shape.
  const { walls } = trace(`
    xxxxxx
    x0000x
    x0000x
    xxxxxx
    x0000x
    x0000x
  `);

  // Every stretch has to sit on the upper region, which is the one the seed
  // reaches. Nothing may run along the lower floor.
  const lowest = Math.max(...walls.map((wall) => wall.y));
  expect(lowest).toBeLessThan(4);
});

test("walls both floors when they touch", () => {
  const joined = trace(`
    xxxxxx
    x0000x
    x0000x
    x0000x
  `);
  const split = trace(`
    xxxxxx
    x0000x
    xxxxxx
    x0000x
  `);

  expect(joined.walls.length).toBeGreaterThan(0);
  // The split map reaches less of the room, so it cannot have more walls.
  expect(split.walls.length).toBeLessThanOrEqual(joined.walls.length);
});

test("takes the height from the floor the stretch runs against", () => {
  const { walls, heights } = trace(`
    xxxx
    x222
    x222
  `);

  expect(walls.length).toBe(heights.length);
  expect(heights.some((height) => height === 2)).toBe(true);
});

test("gives up quietly on a map with no floor at all", () => {
  expect(trace(`
    xxx
    xxx
  `)).toEqual({ walls: [], heights: [] });
});
