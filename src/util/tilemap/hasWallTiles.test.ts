import { parseTileMapString } from "../parseTileMapString";
import { parseTileMap } from "../parseTileMap";
import { hasWallTiles } from "./hasWallTiles";

const map = (floorplan: string) => parseTileMapString(floorplan);

test("a room with a floor inset from the top and left has walls", () => {
  expect(hasWallTiles(map("xxxx\nx000\nx000\nxxxx"))).toBe(true);
});

test("the editor's own room keeps its walls", () => {
  expect(
    hasWallTiles(
      map(`
        xxxxxxxx
        x0000000
        x0000000
        x0000000
        00000000
        x0000000
        x0000000
        x0000000
      `)
    )
  ).toBe(true);
});

test("a lone floor tile in a void has no walls", () => {
  expect(hasWallTiles(map("xxxx\nxx0x\nxxxx"))).toBe(false);
});

test("an empty room has no walls", () => {
  expect(hasWallTiles(map("xxxx\nxxxx\nxxxx"))).toBe(false);
});

test("a floor that is the whole map has no walls", () => {
  expect(hasWallTiles(map("0000\n0000"))).toBe(false);
});

test("a floor reaching the top edge has no walls", () => {
  expect(hasWallTiles(map("0000\nxxxx\nxxxx"))).toBe(false);
});

test("an empty tilemap has no walls", () => {
  expect(hasWallTiles([] as ReturnType<typeof parseTileMapString>)).toBe(false);
});
