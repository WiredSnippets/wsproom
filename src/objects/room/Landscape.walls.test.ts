import { parseTileMapString } from "../../util/parseTileMapString";
import { parseTileMap } from "../../util/parseTileMap";
import { getWallCollectionMeta } from "./Landscape";

const metaFor = (map: string) =>
  getWallCollectionMeta(parseTileMap(parseTileMapString(map)).tilemap);

test("a room whose floor is inset from the top and left has wall runs", () => {
  const meta = metaFor(`
    xxxxx
    x0000
    x0000
    x0000
  `);

  expect(meta.length).toBeGreaterThan(0);
  expect(meta.some((entry) => entry.type === "colWall")).toBe(true);
  expect(meta.some((entry) => entry.type === "rowWall")).toBe(true);
});

test("an empty room reports no wall runs instead of hanging", () => {
  expect(metaFor("xxx\nxxx\nxxx")).toEqual([]);
});

test("a floor reaching the top edge reports no wall runs instead of hanging", () => {
  expect(metaFor("000\nxxx\nxxx")).toEqual([]);
});

test("a floor reaching the left edge reports no wall runs instead of hanging", () => {
  expect(metaFor("00x\n00x\nxxx")).toEqual([]);
});

test("a floor that is the whole map reports no wall runs instead of hanging", () => {
  expect(metaFor("000\n000\n000")).toEqual([]);
});
