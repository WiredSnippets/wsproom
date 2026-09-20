import { TileType } from "../../types/TileType";
import { parseTileMap } from "../parseTileMap";

export function hasWallTiles(tilemap: TileType[][]): boolean {
  if (tilemap.length === 0) return false;

  return parseTileMap(tilemap).tilemap.some((row) =>
    row.some((tile) => tile.type === "wall")
  );
}
