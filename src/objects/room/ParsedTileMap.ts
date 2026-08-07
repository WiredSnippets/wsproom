import { TileType } from "../../types/TileType";
import { parseTileMap } from "../../util/parseTileMap";

export class ParsedTileMap {
  private _data: ReturnType<typeof parseTileMap>;

  public get highestTile() {
    return this._data.highestTile;
  }

  public get largestDiff() {
    return this._data.largestDiff;
  }

  public get parsedTileTypes() {
    return this._data.tilemap;
  }

  public get wallOffsets() {
    return this._data.wallOffsets;
  }

  constructor(private tilemap: TileType[][]) {
    this._data = parseTileMap(tilemap);
  }

  public getRawTileMap(): TileType[][] {
    return this.tilemap.map((row) => [...row]);
  }
}
