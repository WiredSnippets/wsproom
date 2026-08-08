import { TileType } from "../../types/TileType";
import { ColumnWall } from "./getColumnWalls";
import { RowWall } from "./getRowWalls";
import { traceWalls } from "./traceWalls";

/**
 * Turns the traced outline into the row and column runs the renderer indexes by
 * tile. The walk reports a corner, a direction and a length; which side of the
 * room each direction belongs to follows from the normal it carries:
 *
 * - running along +x the floor lies below the walk, so the run covers the back
 *   of the room — a column wall on the row it walks.
 * - running along -y the floor lies to the right, so the run covers the left of
 *   the room — a row wall on the column it walks.
 *
 * The other two directions come back along the near sides, which the floor
 * itself hides, so they never reach the renderer.
 */
export function wallsFromContour(
  tilemap: TileType[][]
): { rowWalls: RowWall[]; colWalls: ColumnWall[] } {
  const { walls, heights } = traceWalls(tilemap);

  const rowWalls: RowWall[] = [];
  const colWalls: ColumnWall[] = [];

  walls.forEach((wall, index) => {
    const height = heights[index] ?? 0;

    switch (wall.direction) {
      case 0: {
        // Walks the empty row above the floor, covering the tiles it passes.
        const startX = wall.x;
        const endX = wall.x + wall.length - 1;

        if (endX >= startX) {
          colWalls.push({ startX, endX, y: wall.y, height });
        }
        break;
      }

      case 3: {
        // Walks up the empty column left of the floor, so the run ends where
        // the corner is and starts `length` tiles above it.
        const startY = wall.y - wall.length + 1;
        const endY = wall.y;

        if (endY >= startY) {
          rowWalls.push({ startY, endY, x: wall.x, height });
        }
        break;
      }
    }
  });

  return { rowWalls, colWalls };
}
