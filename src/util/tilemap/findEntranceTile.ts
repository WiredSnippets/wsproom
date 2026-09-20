import { TileType } from "../../types/TileType";
import { getNumberOfTileType } from "../getTileInfo";

export function findEntranceTile(
  tilemap: TileType[][]
): { x: number; y: number } | undefined {
  const firstFloorColumn: number[] = [];

  tilemap.forEach((row) => {
    let column = row.length + 1;

    for (let x = 0; x < row.length; x++) {
      if (getNumberOfTileType(row[x]) !== "x") {
        column = x;
        break;
      }
    }

    firstFloorColumn.push(column);
  });

  for (let y = 1; y < firstFloorColumn.length - 1; y++) {
    if (
      firstFloorColumn[y] <= firstFloorColumn[y - 1] - 1 &&
      firstFloorColumn[y] <= firstFloorColumn[y + 1] - 1
    ) {
      return { x: firstFloorColumn[y], y };
    }
  }

  return undefined;
}
