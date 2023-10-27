import type * as PIXI from "pixi.js";

export interface ITileColorable {
  tileLeftColor: number;
  tileRightColor: number;
  tileTopColor: number;
  tileTexture: PIXI.Texture;
}
