import { parseTileMapString } from "../parseTileMapString";
import { getRowWalls } from "./getRowWalls";

test("parses single wall", () => {
  const tilemap = parseTileMapString(`
        xxx
        x00
        x00
    `);

  expect(getRowWalls(tilemap)).toEqual([
    {
      startY: 1,
      endY: 2,
      x: 0,
      height: 0,
    },
  ]);
});

test("parses cornered room", () => {
  const tilemap = parseTileMapString(`
          xxxxx
          xxx00
          xxx00
          x0000
          x0000
      `);

  expect(getRowWalls(tilemap)).toEqual([
    {
      startY: 3,
      endY: 4,
      x: 0,
      height: 0,
    },
    {
      startY: 1,
      endY: 2,
      x: 2,
      height: 0,
    },
  ]);
});

test("parses walls correctly with out of place tile", () => {
  const tilemap = parseTileMapString(`
            xxxxxx
            xxxx00
            xx0x00
            xxxx00
            x00000
            x00000
        `);

  expect(getRowWalls(tilemap)).toEqual([
    {
      startY: 4,
      endY: 5,
      x: 0,
      height: 0,
    },
    {
      startY: 2,
      endY: 2,
      x: 1,
      height: 0,
    },
    {
      startY: 1,
      endY: 3,
      x: 3,
      height: 0,
    },
  ]);
});

test("walls a room whose door sits in the top row", () => {
  const tilemap = parseTileMapString(`
            x0xx
            x000
            x000
        `);

  expect(getRowWalls(tilemap)).toEqual([
    {
      startY: 0,
      endY: 2,
      x: 0,
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

  expect(getRowWalls(tilemap)).toEqual([
    {
      startY: 1,
      endY: 2,
      x: 0,
      height: 0,
    },
    {
      startY: 1,
      endY: 2,
      x: 3,
      height: 0,
    },
  ]);
});
