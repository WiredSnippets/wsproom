import * as PIXI from "pixi.js";
import { applyTextureProperties } from "../../util/applyTextureProperties";
import { loadImageFromBlob } from "../../util/loadImageFromBlob";
import { HitSprite } from "./HitSprite";

export class HitTexture {
  private _texture: PIXI.Texture;
  private _cachedHitmap: Uint32Array | undefined;

  public get texture() {
    return this._texture;
  }

  constructor(texture: PIXI.Texture) {
    this._texture = texture;
    applyTextureProperties(this._texture);
  }

  static async fromSpriteSheet(spritesheet: PIXI.Spritesheet, name: string) {
    const texture = spritesheet.textures[name];
    if (texture == null) {
      throw new Error(`Texture "${name}" not found in spritesheet`);
    }
    return new HitTexture(texture);
  }

  static fromHitmap(hitmap: Uint32Array, width: number, height: number): HitTexture {
    const source = {
      resource: { width, height },
      resolution: 1,
      pixelWidth: width,
      scaleMode: "nearest",
    } as any;
    const texture = {
      source,
      orig: { x: 0, y: 0 },
      frame: { x: 0, y: 0, width, height },
    } as any;
    const instance = new HitTexture(texture);
    (instance as any)._cachedHitmap = hitmap;
    return instance;
  }

  static async fromBlob(blob: Blob) {
    const url = await loadImageFromBlob(blob);

    return HitTexture.fromUrl(url);
  }

  static async fromUrl(imageUrl: string) {
    const image = new Image();

    // We set the crossOrigin here so the image element
    // can fetch and display images hosted on another origin.
    // Thanks to @danielsolartech for reporting.

    // TODO: Add option to configure this somewhere?
    image.crossOrigin = "anonymous";

    image.src = imageUrl;

    await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };

      image.onerror = (value) => reject(value);
    });

    const texture = PIXI.Texture.from(image);

    return new HitTexture(texture);
  }

  public getHitMap() {
    return this._getHitMap();
  }

  hits(
    x: number,
    y: number,
    transform: { x: number; y: number; scaleX?: number; scaleY?: number },
    options: { mirrorHorizonally?: boolean } = { mirrorHorizonally: false }
  ) {
    const scaleX = transform.scaleX ?? 1;
    const scaleY = transform.scaleY ?? 1;

    if (options.mirrorHorizonally) {
      x = -(x - transform.x) / scaleX;
    } else {
      x = (x - transform.x) / scaleX;
    }
    y = (y - transform.y) / scaleY;

    const frame = this._texture.frame;
    const width = Math.max(1, Math.round(frame.width));
    const height = Math.max(1, Math.round(frame.height));

    const dx = Math.round(x);
    const dy = Math.round(y);

    if (dx < 0 || dy < 0 || dx >= width || dy >= height) return false;

    const hitmap = this._getHitMap();

    const ind = dx + dy * width;
    const ind1 = ind % 32;
    const ind2 = (ind / 32) | 0;
    return (hitmap[ind2] & (1 << ind1)) !== 0;
  }

  private _getHitMap() {
    if (this._cachedHitmap == null) {
      this._cachedHitmap = generateHitMap(this._texture);
    }

    return this._cachedHitmap ?? new Uint32Array();
  }
}

function generateHitMap(texture: PIXI.Texture) {
  const source = texture.source.resource as CanvasImageSource | undefined;
  if (source == null) return new Uint32Array();

  const frame = texture.frame;
  const w = Math.max(1, Math.round(frame.width));
  const h = Math.max(1, Math.round(frame.height));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context == null) throw new Error("Invalid context 2d");

  context.drawImage(
    source,
    Math.round(frame.x),
    Math.round(frame.y),
    w,
    h,
    0,
    0,
    w,
    h
  );

  const threshold = 25;
  const imageData = context.getImageData(0, 0, w, h);

  const hitmap = new Uint32Array(Math.ceil((w * h) / 32));
  for (let i = 0; i < w * h; i++) {
    const ind1 = i % 32;
    const ind2 = (i / 32) | 0;
    if (imageData.data[i * 4 + 3] >= threshold) {
      hitmap[ind2] = hitmap[ind2] | (1 << ind1);
    }
  }

  return hitmap;
}
