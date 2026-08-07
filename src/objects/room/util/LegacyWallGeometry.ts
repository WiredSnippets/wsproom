import { ParsedTileType } from "../../../util/parseTileMap";

export class LegacyWallGeometry {
  private static readonly RIGHT_WALL: string = "l";
  private static readonly LEFT_WALL: string = "r";

  /** Habbo caps how much taller than the floor a wall may grow. */
  public static readonly MAX_WALL_ADDITIONAL_HEIGHT = 20;
  /** Habbo's default wall height, in tiles. */
  public static readonly WALL_HEIGHT = 3.6;

  private _width: number;
  private _height: number;
  private _scale: number;
  private _wallTop: number;

  constructor(private _heightmap: ParsedTileType[][]) {
    this._width = _heightmap[0].length;
    this._height = _heightmap.length;
    this._scale = 64;
    this._wallTop = getWallTop(_heightmap);
  }

  public getLocation(
    roomX: number,
    roomY: number,
    offsetX: number,
    offsetY: number,
    wall: string
  ): { x: number; y: number; z: number } {
    let rX: number = roomX;
    let rY: number = roomY;
    let rZ: number = this.getHeight(roomX, roomY);
    if (wall == LegacyWallGeometry.LEFT_WALL) {
      rX = rX + (offsetX / (this._scale / 2) - 0.5);
      rY = rY + 0.5;
      rZ = rZ - (offsetY - offsetX / 2) / (this._scale / 2);
    } else {
      rY = rY + ((this._scale / 2 - offsetX) / (this._scale / 2) - 0.5);
      rX = rX + 0.5;
      rZ = rZ - (offsetY - (this._scale / 2 - offsetX) / 2) / (this._scale / 2);
    }
    return {
      x: rX,
      y: rY,
      z: rZ,
    };
  }

  /**
   * Height of the tile a wall item hangs on. Anywhere there is no floor — a wall
   * or a gap in the model — Habbo answers with the height of the wall top, not
   * zero, and wall item offsets are measured against that.
   */
  public getHeight(x: number, y: number): number {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height)
      return this._wallTop;

    const row = this._heightmap[y];

    if (row == null) return this._wallTop;
    const cell = row[x];

    if (cell == null) return this._wallTop;

    switch (cell.type) {
      case "stairs":
      case "stairCorner":
      case "door":
      case "tile":
        return cell.z;
    }

    return this._wallTop;
  }
}

function getWallTop(heightmap: ParsedTileType[][]) {
  let highest = 0;

  heightmap.forEach((row) =>
    row.forEach((cell) => {
      switch (cell.type) {
        case "stairs":
        case "stairCorner":
        case "door":
        case "tile":
          if (cell.z > highest) highest = cell.z;
      }
    })
  );

  return (
    Math.min(LegacyWallGeometry.MAX_WALL_ADDITIONAL_HEIGHT, highest) +
    LegacyWallGeometry.WALL_HEIGHT
  );
}
