import { TileType } from "../../types/TileType";
import { getTileInfo } from "../getTileInfo";

export type ColumnWall = {
  startX: number;
  endX: number;
  y: number;
  height: number;
};

export function getColumnWalls(tilemap: TileType[][]) {
  const walls: ColumnWall[] = [];

  for (let y = 0; y < tilemap.length; y++) {
    let wallEndX: number | undefined;
    let wallStartX: number | undefined;
    let height: number | undefined;

    const flush = () => {
      if (wallEndX != null && wallStartX != null) {
        walls.push({
          startX: wallStartX,
          endX: wallEndX,
          y: y - 1,
          height: height ?? 0,
        });
      }
      wallEndX = undefined;
      wallStartX = undefined;
      height = undefined;
    };

    for (let x = tilemap[y].length - 1; x >= 0; x--) {
      const current = getTileInfo(tilemap, x, y);

      if (current.colEdge && !current.rowDoor) {
        if (wallEndX == null) {
          wallEndX = x;
        }

        wallStartX = x;

        if (height == null || (current.height ?? 0) < height) {
          height = current.height;
        }
      } else {
        flush();
      }
    }

    flush();
  }

  return walls;
}
