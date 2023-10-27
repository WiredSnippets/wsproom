import { getTilePosition } from "./getTilePosition";
import type * as PIXI from "pixi.js";

export function getTilePositionForTile(roomX: number, roomY: number) {
  return {
    top: getTilePosition(roomX, roomY),
    left: getTilePosition(roomX, roomY + 1),
    right: getTilePosition(roomX + 1, roomY),
  };
}

export interface TilePositionForTile {
  left: PIXI.Point;
  right: PIXI.Point;
  top: PIXI.Point;
}
