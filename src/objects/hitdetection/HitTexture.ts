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
    const texture = { source, orig: { x: 0, y: 0 } } as any;
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

    const source = this._texture.source;
    const hitmap = this._getHitMap();

    const dx = Math.round(this._texture.orig.x + x * source.resolution);
    const dy = Math.round(this._texture.orig.y + y * source.resolution);
    const ind = dx + dy * source.pixelWidth;
    const ind1 = ind % 32;
    const ind2 = (ind / 32) | 0;
    return (hitmap[ind2] & (1 << ind1)) !== 0;
  }

  private _getHitMap() {
    if (this._cachedHitmap == null) {
      this._cachedHitmap = generateHitMap(
        this._texture.source.resource as HTMLImageElement
      );
    }

    return this._cachedHitmap ?? new Uint8ClampedArray();
  }
}

function generateHitMap(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");

  if (context == null) throw new Error("Invalid context 2d");

  const threshold = 25;

  const w = canvas.width;
  const h = canvas.height;
  context.drawImage(image, 0, 0);

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
