import * as PIXI from "pixi.js";

export function applyTextureProperties(texture: PIXI.Texture) {
  texture.source.scaleMode = "nearest";
}
