import type * as PIXI from "pixi.js";

export interface IWallColorable {
  wallLeftColor: number;
  wallRightColor: number;
  wallTopColor: number;
  wallTexture: PIXI.Texture;
}
