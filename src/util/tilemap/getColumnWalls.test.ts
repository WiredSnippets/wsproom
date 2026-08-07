import { parseTileMapString } from "../parseTileMapString";
import { getColumnWalls } from "./getColumnWalls";

test("parses single wall", () => {
  const tilemap = parseTileMapString(`
        xxx
        x00
        x00
    `);

  expect(getColumnWalls(tilemap)).toEqual([
    {
      startX: 1,
      endX: 2,
      y: 0,
      height: 0,
    },
  ]);
});

test("leaves a gap where the door sits in the top row", () => {
  const tilemap = parseTileMapString(`
        x0xx
        x000
        x000
    `);

  expect(getColumnWalls(tilemap)).toEqual([
    {
      startX: 1,
      endX: 1,
      y: -1,
      height: 0,
    },
    {
      startX: 2,
      endX: 3,
      y: 0,
      height: 0,
    },
  ]);
});

test("walls every disjoint region, not just the first", () => {
  const tilemap = parseTileMapString(`
        xxxxxxx
        x00x00x
        x00x00x
    `);

  expect(getColumnWalls(tilemap)).toEqual([
    {
      startX: 4,
      endX: 5,
      y: 0,
      height: 0,
    },
    {
      startX: 1,
      endX: 2,
      y: 0,
      height: 0,
    },
  ]);
});
