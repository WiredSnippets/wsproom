import * as PIXI from "pixi.js";
import { PartNode } from "../../interfaces/IRoomVisualization";
import { ParsedTileType } from "../../util/parseTileMap";
import { RoomObject } from "../RoomObject";
import { IRoomPart } from "./parts/IRoomPart";
import { RoomPartData } from "./parts/RoomPartData";
import { getMaskId } from "./util/getMaskId";

interface WallCollectionMeta {
  type: "rowWall" | "colWall";
  start: number;
  end: number;
  level: number;
}

/**
 * A landscape is a stack of layers drawn behind the walls, in the same shape
 * Habbo ships inside its room visualization data: a static layer is a material
 * tiled across every wall of one orientation, an animated layer is a set of
 * items that drift across it. Positions and speeds are normalised (0..1) over
 * the whole landscape, which is what keeps it continuous from wall to wall.
 */
export interface LandscapeAnimationItem {
  asset: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  /** Spread added to `x`/`y` once when the landscape is set, so repeated items
   * (clouds, birds) don't stack on top of each other. */
  randomX?: number;
  randomY?: number;
}

export interface LandscapeLayer {
  material?: string;
  color?: number;
  align?: "top" | "bottom";
  offset?: number;
  items?: LandscapeAnimationItem[];
}

export interface LandscapeVisualization {
  layers: LandscapeLayer[];
}

interface AnimatedSprite {
  sprite: PIXI.Sprite;
  item: LandscapeAnimationItem;
  span: number;
  height: number;
  planeOffset: number;
  wrapX: number;
  wrapY: number;
}

type Unsubscribe = () => void;

export class Landscape extends RoomObject implements IRoomPart {
  private _container: PIXI.Container | undefined;
  private _leftTexture: PIXI.Texture | undefined;
  private _rightTexture: PIXI.Texture | undefined;
  private _wallHeight = 0;
  private _wallHeightWithZ = 0;

  private _leftTexturePromise: PIXI.Texture | Promise<PIXI.Texture> | undefined;
  private _rightTexturePromise:
    | PIXI.Texture
    | Promise<PIXI.Texture>
    | undefined;

  private _masks: Map<string, PIXI.Sprite> = new Map();
  private _color: string | undefined;
  private _unsubscribe: Unsubscribe | undefined = undefined;

  private _visualization: LandscapeVisualization | undefined;
  private _assets: Map<string, PIXI.Texture> = new Map();
  private _animated: AnimatedSprite[] = [];
  private _startedAt: number | undefined;

  private _partNode: PartNode | undefined;

  constructor() {
    super();
  }

  public get color() {
    return this._color;
  }

  public set color(value) {
    this._color = value;
    this._updateLandscapeImages();
  }

  public get leftTexture() {
    return this._leftTexturePromise;
  }

  public set leftTexture(value) {
    this._leftTexturePromise = value;
    Promise.resolve(this._leftTexturePromise).then((value) => {
      this._leftTexture = value;
      this._updateLandscapeImages();
    });
  }

  public get rightTexture() {
    return this._rightTexturePromise;
  }

  public set rightTexture(value) {
    this._rightTexturePromise = value;
    Promise.resolve(this._rightTexturePromise).then((value) => {
      this._rightTexture = value;
      this._updateLandscapeImages();
    });
  }

  setVisualization(
    visualization: LandscapeVisualization,
    assets: Record<string, PIXI.Texture> = {}
  ) {
    this._visualization = {
      layers: visualization.layers.map((layer) => ({
        ...layer,
        items: layer.items?.map((item) => ({
          ...item,
          x: item.x + Math.random() * (item.randomX ?? 0),
          y: item.y + Math.random() * (item.randomY ?? 0),
        })),
      })),
    };
    this._assets = new Map(Object.entries(assets));
    this._updateLandscapeImages();
  }

  update(data: RoomPartData): void {
    this._masks = data.masks;
    this._wallHeightWithZ = data.wallHeight;

    this._updateLandscapeImages();
  }

  destroyed(): void {
    this._unsubscribe && this._unsubscribe();
    this._unsubscribe = undefined;
    this._container?.destroy();
    this._partNode?.remove();
  }

  registered(): void {
    this._partNode = this.roomVisualization.addPart(this);
    this._unsubscribe = this.animationTicker.subscribe(() =>
      this._updateAnimatedItems()
    );
    this._updateLandscapeImages();
  }

  private _updateAnimatedItems() {
    if (this._animated.length === 0) return;

    if (this._startedAt == null) this._startedAt = performance.now();
    const elapsed = performance.now() - this._startedAt;

    this._animated.forEach(
      ({ sprite, item, span, height, planeOffset, wrapX, wrapY }) => {
        const point = getLandscapeItemPosition(item, span, height, elapsed);

        sprite.x = point.x - planeOffset + wrapX * span;
        sprite.y = point.y - height + wrapY * height;
      }
    );
  }

  private _createDefaultMask() {
    return new PIXI.Graphics();
  }

  private _getMask(direction: number, roomX: number, roomY: number) {
    const maskId = getMaskId(direction, roomX, roomY);

    if (maskId != null) {
      const mask = this._masks.get(maskId);

      if (mask != null) return mask;
    }

    return this._createDefaultMask();
  }

  /**
   * Draws one landscape layer into a wall. `planeOffset` is how far along the
   * whole landscape this wall starts, and `span` its total width, so a material
   * tiles seamlessly and an item drifting off one wall arrives on the next.
   */
  private _createLayer(
    layer: LandscapeLayer,
    wall: PIXI.Container,
    width: number,
    planeOffset: number,
    span: number
  ) {
    const height = this._wallHeightWithZ;

    if (layer.material != null) {
      const texture = this._assets.get(layer.material);

      if (texture != null) {
        const material = new PIXI.TilingSprite({
          texture,
          width,
          height: layer.align === "top" ? height : texture.height,
        });

        material.tilePosition.set(-planeOffset, 0);
        material.x = 0;
        material.y =
          (layer.align === "top" ? -height : -texture.height) +
          (layer.offset ?? 0);

        if (layer.color != null) material.tint = layer.color;

        wall.addChild(material);
      }
    } else if (layer.color != null) {
      const colored = new PIXI.TilingSprite(PIXI.Texture.WHITE, width, height);
      colored.tint = layer.color;
      colored.y = -height;
      wall.addChild(colored);
    }

    layer.items?.forEach((item) => {
      const texture = this._assets.get(item.asset);
      if (texture == null) return;

      // Four copies, offset by a full landscape in each axis, so an item that
      // walks off one edge is already arriving at the opposite one.
      [
        [0, 0],
        [-1, 0],
        [0, -1],
        [-1, -1],
      ].forEach(([wrapX, wrapY]) => {
        const sprite = new PIXI.Sprite(texture);
        wall.addChild(sprite);

        this._animated.push({
          sprite,
          item,
          span,
          height,
          planeOffset,
          wrapX,
          wrapY,
        });
      });
    });
  }

  private _updateLandscapeImages() {
    if (!this.mounted) return;

    const meta = getWallCollectionMeta(this.tilemap.getParsedTileTypes());
    this._container?.destroy();
    this._animated = [];
    const container = new PIXI.Container();

    const spanOf = (type: WallCollectionMeta["type"]) =>
      meta
        .filter((entry) => entry.type === type)
        .reduce((total, entry) => total + Math.abs(entry.end - entry.start) * 32, 0);

    const rowSpan = spanOf("rowWall");
    const colSpan = spanOf("colWall");

    let offsetRow = 0;
    let offsetCol = 0;

    meta.forEach((meta) => {
      const width = Math.abs(meta.end - meta.start) * 32;

      const wall = new PIXI.Container();

      if (this._visualization == null) {
        const colored = new PIXI.TilingSprite(
          PIXI.Texture.WHITE,
          width,
          this._wallHeightWithZ
        );

        if (this.color != null) {
          colored.tint = parseInt(this.color.slice(1), 16);
        } else {
          colored.tint = 0xffffff;
        }

        colored.y = -this._wallHeightWithZ;

        wall.addChild(colored);
      } else {
        this._visualization.layers.forEach((layer) =>
          this._createLayer(
            layer,
            wall,
            width,
            meta.type === "rowWall" ? offsetRow : offsetCol,
            meta.type === "rowWall" ? rowSpan : colSpan
          )
        );
      }

      if (meta.type === "rowWall") {
        const maskLevel = this.landscapeContainer.getMaskLevel(meta.level, 0);

        const mask = this._getMask(2, maskLevel.roomX, 0);
        wall.mask = mask;

        const position = this.geometry.getPosition(
          meta.level + 1,
          meta.start,
          0
        );

        wall.setFromMatrix(new PIXI.Matrix(1, -0.5, 0, 1));

        wall.x = position.x;
        wall.y = position.y + 16;

        if (this._visualization == null && this._leftTexture != null) {
          const graphics = new PIXI.TilingSprite({
            texture: this._leftTexture,
            width,
            height: this._leftTexture.height,
          });

          graphics.tilePosition.set(offsetRow, 0);
          graphics.texture = this._leftTexture;
          graphics.x = 0;
          graphics.y = -this._leftTexture.height;
          wall.addChild(graphics);
        }

        offsetRow += width;
      } else if (meta.type === "colWall") {
        const maskLevel = this.landscapeContainer.getMaskLevel(0, meta.level);
        const mask = this._getMask(4, 0, maskLevel.roomY);
        wall.mask = mask;

        const position = this.geometry.getPosition(
          meta.start + 1,
          meta.level + 1,
          0
        );

        wall.setFromMatrix(new PIXI.Matrix(1, 0.5, 0, 1));

        wall.x = position.x + 32;
        wall.y = position.y;

        if (this._visualization == null && this._rightTexture != null) {
          const graphics = new PIXI.TilingSprite({
            texture: this._rightTexture,
            width,
            height: this._rightTexture.height,
          });
          graphics.texture = this._rightTexture;
          graphics.x = 0;
          graphics.y = -this._rightTexture.height;
          graphics.tilePosition.set(offsetCol, 0);
          wall.addChild(graphics);
        }

        offsetCol += width;
      }

      container.addChild(wall);
    });

    this._container = container;

    this.roomVisualization.landscapeContainer.addChild(container);
  }
}

const wrap = (value: number) => ((value % 1) + 1) % 1;

/**
 * Where an animated item sits after `elapsed` ms. Speeds are room units per
 * second across the whole landscape, so the item crosses it in the same time
 * no matter how large the room is.
 */
export function getLandscapeItemPosition(
  item: LandscapeAnimationItem,
  span: number,
  height: number,
  elapsed: number
) {
  const tilesX = span / 32;
  const tilesY = height / 32;

  return {
    x: Math.trunc(
      wrap(item.x + (tilesX > 0 ? (item.speedX / tilesX) * (elapsed / 1000) : 0)) *
        span
    ),
    y: Math.trunc(
      wrap(item.y + (tilesY > 0 ? (item.speedY / tilesY) * (elapsed / 1000) : 0)) *
        height
    ),
  };
}

const getTile = (parsedTileMap: ParsedTileType[][], x: number, y: number) => {
  const row = parsedTileMap[y];
  if (row == null) return;

  return row[x];
};

function getWallCollectionMeta(parsedTileMap: ParsedTileType[][]) {
  const { x: startX, y: startY } = getStartingWall(parsedTileMap);

  let x = startX;
  let y = startY;
  let done = false;
  let meta: WallCollectionMeta | undefined = undefined;
  const arr: WallCollectionMeta[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentWall = getTile(parsedTileMap, x, y);

    const topWallPosition = { x, y: y - 1 };
    const rightWallPosition = { x: x + 1, y };

    const topWall = getTile(
      parsedTileMap,
      topWallPosition.x,
      topWallPosition.y
    );
    const rightWall = getTile(
      parsedTileMap,
      rightWallPosition.x,
      rightWallPosition.y
    );

    if (
      currentWall == null ||
      (currentWall.type !== "wall" && currentWall.type !== "door")
    )
      break;

    const updateMeta = (newMeta: WallCollectionMeta) => {
      if (meta == null) {
        meta = newMeta;
        return;
      }

      if (meta != null && meta.type !== newMeta.type) {
        arr.push(meta);
        meta = newMeta;
        return;
      }

      meta = {
        ...meta,
        level: newMeta.level,
        end: newMeta.end,
      };
    };

    if (currentWall.type === "wall") {
      switch (currentWall.kind) {
        case "rowWall":
        case "innerCorner":
          updateMeta({ type: "rowWall", start: y, end: y - 1, level: x });
          break;

        case "colWall":
        case "outerCorner":
          updateMeta({
            type: "colWall",
            start: x,
            end: x + (done ? 0 : 1),
            level: y,
          });
          break;
      }
    } else if (currentWall.type === "door") {
      updateMeta({ type: "rowWall", start: y, end: y - 1, level: x });
    }

    if (done) {
      if (meta != null) {
        arr.push(meta);
      }
      break;
    }

    if (
      topWall != null &&
      (topWall.type === "wall" || topWall.type === "door")
    ) {
      x = topWallPosition.x;
      y = topWallPosition.y;
    } else if (rightWall != null && rightWall.type === "wall") {
      x = rightWallPosition.x;
      y = rightWallPosition.y;
    } else {
      done = true;
    }
  }

  return arr;
}

function getStartingWall(parsedTileMap: ParsedTileType[][]) {
  const startY = parsedTileMap.length - 1;
  let y = startY;
  let x = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const current = getTile(parsedTileMap, x, y);

    if (current != null && current.type === "wall") {
      return { x, y };
    } else {
      y--;
      if (y < 0) {
        y = startY;
        x++;
      }
    }
  }
}
