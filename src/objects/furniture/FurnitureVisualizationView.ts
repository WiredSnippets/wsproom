import * as PIXI from "pixi.js";
import { EventOverOutHandler } from "../events/EventOverOutHandler";

import {
  EventGroupIdentifier,
  FURNITURE,
  IEventGroup,
} from "../events/interfaces/IEventGroup";
import { IEventManager } from "../events/interfaces/IEventManager";
import { ClickHandler } from "../hitdetection/ClickHandler";
import { HitTexture } from "../hitdetection/HitTexture";
import { FurnitureAsset } from "./data/interfaces/IFurnitureAssetsData";
import { IFurnitureVisualizationData } from "./data/interfaces/IFurnitureVisualizationData";
import { HighlightFilter } from "./filter/HighlightFilter";
import { ActiveWiredFilter } from "./filter/ActiveWiredFilter";
import { FurnitureSprite } from "./FurnitureSprite";
import {
  IFurnitureVisualizationLayer,
  IFurnitureVisualizationView,
} from "./IFurnitureVisualizationView";
import { FurniDrawDefinition, FurniDrawPart } from "./util/DrawDefinition";
import { LoadFurniResult } from "./util/loadFurni";
import { IConfiguration } from "../../interfaces/IConfiguration";

const activeWiredFilter = new ActiveWiredFilter();

const DEFAULT_HIGHLIGHT_FILTERS: Record<string, PIXI.Filter> = {
  default: new HighlightFilter(0x7dabab, 0xffffff, 1),
  primary: new HighlightFilter(0xb8d45a, 0xffffff, 1),
  secondary: new HighlightFilter(0x727dd9, 0xffffff, 1),
};

export class FurnitureVisualizationView
  implements IFurnitureVisualizationView, IBaseFurniture, IEventGroup {
  private _direction: number | undefined;
  private _animation: string | undefined;

  private _cache: Map<string, FurniDrawDefinition> = new Map();
  private _layers: FurnitureVisualizationLayer[] | undefined;

  private _x: number | undefined;
  private _y: number | undefined;
  private _zIndex: number | undefined;
  private _alpha: number | undefined;
  private _highlight: boolean | string | undefined;
  private _activeWired = false;

  public get activeWired() {
    return this._activeWired;
  }

  public set activeWired(value) {
    this._activeWired = value;
  }

  public get x() {
    if (this._x == null) throw new Error("x not set");

    return this._x;
  }

  public set x(value) {
    this._x = value;
  }

  public get y() {
    if (this._y == null) throw new Error("y not set");

    return this._y;
  }

  public set y(value) {
    this._y = value;
  }

  public get zIndex() {
    if (this._zIndex == null) throw new Error("zIndex not set");

    return this._zIndex;
  }

  public set zIndex(value) {
    this._zIndex = value;
  }

  public get alpha() {
    if (this._alpha == null) throw new Error("alpha not set");

    return this._alpha;
  }

  public set alpha(value) {
    this._alpha = value;
  }

  public get highlight() {
    if (this._highlight == null) throw new Error("highlight not set");

    return this._highlight;
  }

  public set highlight(value) {
    this._highlight = value;
  }

  constructor(
    private _eventManager: IEventManager,
    private _clickHandler: ClickHandler,
    private _overOutHandler: EventOverOutHandler,
    private _container: PIXI.Container,
    private _furniture: LoadFurniResult,
    private _configuration: IConfiguration = {}
  ) {}

  public get configuration() {
    return this._configuration;
  }

  getEventGroupIdentifier(): EventGroupIdentifier {
    return FURNITURE;
  }

  getLayers(): IFurnitureVisualizationLayer[] {
    if (this._layers == null)
      throw new Error(
        "Layers not set yet. Call `updateDisplay` before accessing the layers."
      );

    return this._layers;
  }

  getVisualizationData(): IFurnitureVisualizationData {
    return this._furniture.visualizationData;
  }

  setDisplayAnimation(animation?: string): void {
    if (this._animation !== animation) {
      this._cache.clear();
    }
    this._animation = animation;
  }

  setDisplayDirection(direction: number): void {
    this._direction = direction;
  }

  updateLayers() {
    this._layers?.forEach((layer) => {
      layer.x = this.x;
      layer.y = this.y;
      layer.zIndex = this.zIndex;
      layer.alpha = this.alpha;
      layer.highlight = this.highlight;
      layer.activeWired = this.activeWired;
      layer.update();
    });
  }

  updateDisplay(): void {
    if (this._direction == null) throw new Error("Direction was not set");

    const direction = this._direction;
    const animation = this._animation;

    this._layers?.forEach((layer) => layer.destroy());
    this._layers = this._getDrawDefinition(direction, animation).parts.map(
      (part) =>
        new FurnitureVisualizationLayer(
          this,
          this._container,
          part,
          this._eventManager,
          this._clickHandler,
          this._overOutHandler,
          (id) => this._furniture.getTexture(id)
        )
    );

    this.updateLayers();
  }

  destroy() {
    this._layers?.forEach((layer) => layer.destroy());
  }

  private _getDrawDefinition(direction: number, animation?: string) {
    animation = animation ?? "undefined";

    const key = `${direction}_${animation}`;
    const current = this._cache.get(key);
    if (current != null) return current;

    const definition = this._furniture.getDrawDefinition(direction, animation);

    this._cache.set(key, definition);

    return definition;
  }
}

class FurnitureVisualizationLayer
  implements IFurnitureVisualizationLayer, IBaseFurniture {
  public readonly frameRepeat: number;
  public readonly layerIndex: number;
  public readonly assetCount: number;

  private _sprites = new Map<number, FurnitureSprite>();

  private _x: number | undefined;
  private _y: number | undefined;
  private _zIndex: number | undefined;
  private _alpha: number | undefined;
  private _highlight: boolean | string | undefined;
  private _activeWired: boolean | undefined;

  private _spritePositionChanged = false;
  private _spritesChanged = false;
  private _frameIndex = 0;
  private _appliedFrameIndex: number | undefined;
  private _color: number | undefined;
  private _allSpritesMounted = false;

  private _mountedSprites = new Set<FurnitureSprite>();

  public get highlight() {
    if (this._highlight == null) throw new Error("highlight not set");

    return this._highlight;
  }

  public set highlight(value) {
    if (value === this._highlight) return;

    this._highlight = value;
    this._spritesChanged = true;
  }

  public get activeWired() {
    return this._activeWired ?? false;
  }

  public set activeWired(value) {
    if (value === this._activeWired) return;

    this._activeWired = value;
    this._spritesChanged = true;
  }

  public get alpha() {
    if (this._alpha == null) throw new Error("alpha not set");

    return this._alpha;
  }

  public set alpha(value) {
    if (value === this._alpha) return;

    this._alpha = value;
    this._spritesChanged = true;
  }

  public get x() {
    if (this._x == null) throw new Error("x not set");

    return this._x;
  }

  public set x(value) {
    if (value === this._x) return;

    this._x = value;
    this._spritePositionChanged = true;
  }

  public get y() {
    if (this._y == null) throw new Error("y not set");

    return this._y;
  }

  public set y(value) {
    if (this._y === value) return;

    this._y = value;
    this._spritePositionChanged = true;
  }

  public get zIndex() {
    if (this._zIndex == null) throw new Error("zIndex not set");

    return this._zIndex;
  }

  public set zIndex(value) {
    if (this._zIndex === value) return;

    this._zIndex = value;
    this._spritePositionChanged = true;
  }

  public get tag() {
    return this._part.layer?.tag;
  }

  public get z() {
    return this._part.z ?? 0;
  }

  public get ink() {
    return this._part.layer?.ink;
  }

  getSprites(): PIXI.Sprite[] {
    return Array.from(this._sprites.values());
  }

  constructor(
    private _parent: FurnitureVisualizationView,
    private _container: PIXI.Container,
    private _part: FurniDrawPart,
    private _eventManager: IEventManager,
    private _clickHandler: ClickHandler,
    private _overOutHandler: EventOverOutHandler,
    private _getTexture: (id: string) => HitTexture | undefined
  ) {
    this.frameRepeat = _part.frameRepeat;
    this.layerIndex = _part.layerIndex;
    this.assetCount = _part.assets.length;
  }

  setColor(color: number): void {
    if (this._color === color) return;

    this._color = color;
    this._spritesChanged = true;
  }

  setCurrentFrameIndex(value: number): void {
    if (this._appliedFrameIndex === value) return;
    this._appliedFrameIndex = value;

    const previousFrameIndex = this._frameIndex;
    this._frameIndex = value;

    const previousFrame = this._getSprite(previousFrameIndex);
    if (previousFrame != null) {
      this._setSpriteVisible(previousFrame, false);
    }

    const newFrame = this._getSprite(this._frameIndex);
    if (newFrame != null) {
      this._setSpriteVisible(newFrame, true);
      this._addSprite(newFrame);

      if (this._color != null) {
        newFrame.tint = this._color;
      }
    }
  }

  update() {
    if (!this._allSpritesMounted) {
      this._allSpritesMounted = true;
      this._mountAllSprites();
    }

    if (this._spritePositionChanged) {
      this._spritePositionChanged = false;
      this._updateSpritesPosition();
    }

    if (this._spritesChanged) {
      this._spritesChanged = false;
      this._destroySprites();
      this._updateSprites();
    }
  }

  destroy() {
    this._destroySprites();
  }

  private _updateSpritePosition(sprite: FurnitureSprite) {
    sprite.baseX = this.x;
    sprite.baseY = this.y;
    sprite.baseZIndex = this.zIndex;
  }

  private _addSprite(sprite: FurnitureSprite) {
    if (this._mountedSprites.has(sprite)) return;

    this._mountedSprites.add(sprite);
    this._container.addChild(sprite);
    this._overOutHandler.register(sprite.events);
  }

  private _destroySprites() {
    this._sprites.forEach((sprite) => {
      this._container.removeChild(sprite);
      this._overOutHandler.remove(sprite.events);
      sprite.destroy();
    });
    this._sprites = new Map();
    this._mountedSprites = new Set();
    this._appliedFrameIndex = undefined;
  }

  private _setSpriteVisible(sprite: FurnitureSprite, visible: boolean) {
    if (visible) {
      sprite.ignore = false;
      sprite.visible = true;
    } else {
      sprite.ignore = true;
      sprite.visible = false;
    }
  }

  // Mounts every frame's sprite (hidden) up front. Layers are processed in
  // draw order, so this pins the container insertion order to the layer
  // order. With lazy mounting, sprites of equal zIndex were stacked by
  // whichever layer created a new frame sprite last, making upper layers
  // (e.g. the "b" overlay of wired selectors) intermittently disappear
  // behind lower ones.
  private _mountAllSprites() {
    for (let i = 0; i < this.assetCount; i++) {
      const sprite = this._getSprite(i);
      if (sprite != null) this._addSprite(sprite);
    }
  }

  private _updateSprites() {
    this._mountAllSprites();

    const frameIndex = this._frameIndex;
    const sprite = this._getSprite(frameIndex);

    this._sprites.forEach((sprite) => this._setSpriteVisible(sprite, false));

    if (sprite != null) {
      this._addSprite(sprite);
      this._setSpriteVisible(sprite, true);
    }
  }

  private _updateSpritesPosition() {
    this._sprites.forEach((sprite) => {
      this._updateSpritePosition(sprite);
    });
  }

  private _getSpriteInfo(frameIndex: number) {
    const asset: FurnitureAsset | undefined = this._part.assets[frameIndex];

    if (asset == null) return;

    const texture = this._getTexture(getAssetTextureName(asset));

    return {
      asset,
      texture,
    };
  }

  private _getSprite(frameIndex: number) {
    const current = this._sprites.get(frameIndex);
    if (current != null) {
      return current;
    }

    const spriteInfo = this._getSpriteInfo(frameIndex);
    if (spriteInfo == null) return;

    const { z, layer, shadow, mask, tint } = this._part;
    const { asset, texture } = spriteInfo;

    const zIndex = z ?? 0;

    const sprite = new FurnitureSprite({
      eventManager: this._eventManager,
      mirrored: asset.flipH,
      tag: layer?.tag,
      group: this._parent,
    });

    const ignoreMouse = layer?.ignoreMouse != null && layer.ignoreMouse;
    sprite.ignoreMouse = ignoreMouse;

    sprite.events.addEventListener("click", (event) => {
      this._clickHandler.handleClick(event);
    });

    sprite.events.addEventListener("pointerup", (event) => {
      this._clickHandler.handlePointerUp(event);
    });

    sprite.events.addEventListener("pointerdown", (event) => {
      this._clickHandler.handlePointerDown(event);
    });

    sprite.hitTexture = texture;

    // Apply asset styling
    const highlight = this._highlight /* && layer?.ink == null */ && !shadow && !mask;

    const configuration = this._parent.configuration;
    const custom = configuration.highlightFilters;
    const wiredFilter = configuration.activeWiredFilter ?? activeWiredFilter;

    if (highlight) {
      const key =
        typeof this._highlight === 'string' ? this._highlight : 'default';

      const filter =
        custom?.[key] ??
        DEFAULT_HIGHLIGHT_FILTERS[key] ??
        custom?.default ??
        DEFAULT_HIGHLIGHT_FILTERS.default;

      sprite.filters = this._activeWired ? [filter, wiredFilter] : [filter];
    } else if (this._activeWired && !shadow && !mask) {
      sprite.filters = [wiredFilter];
    } else {
      sprite.filters = [];
    }

    const scaleX = asset.flipH ? -1 : 1;

    const offsetX = +(32 - asset.x * scaleX);
    const offsetY = -asset.y + 16;

    sprite.offsetX = offsetX;
    sprite.offsetY = offsetY;
    sprite.offsetZIndex = zIndex;

    sprite.baseX = this.x;
    sprite.baseY = this.y;
    sprite.baseZIndex = this.zIndex;

    if (shadow) {
      sprite.baseZIndex = this.zIndex;
      sprite.offsetZIndex = -this.zIndex;
    }

    if (tint != null) {
      sprite.tint = parseInt(tint, 16);
    }

    const alpha = this._getAlpha({
      baseAlpha: this.alpha,
      layerAlpha: layer?.alpha,
    });

    if (layer != null) {
      if (layer.ink != null) {
        if (this.highlight) {
          sprite.visible = false;
        }
        sprite.blendMode = inkToBlendMode(layer.ink);
      }
    }

    if (shadow) {
      if (this.highlight) {
        sprite.visible = false;
        sprite.alpha = 0;
      } else {
        sprite.visible = true;
        sprite.alpha = alpha / 5;
      }
    } else {
      sprite.visible = true;
      sprite.alpha = alpha;
    }

    if (mask) {
      sprite.tint = 0xffffff;
    }

    if (this._color != null) {
      sprite.tint = this._color;
    }

    this._setSpriteVisible(sprite, false);
    this._sprites.set(frameIndex, sprite);

    this._overOutHandler.register(sprite.events);

    return sprite;
  }

  private _getAlpha({
    layerAlpha,
    baseAlpha,
  }: {
    layerAlpha?: number;
    baseAlpha: number;
  }) {
    if (layerAlpha != null) return (layerAlpha / 255) * baseAlpha;

    return baseAlpha;
  }
}

const getAssetTextureName = (asset: FurnitureAsset) =>
  asset.source ?? asset.name;

const inkToBlendMode = (ink: string): PIXI.BLEND_MODES => {
  if (ink === "ADD" || ink === "33" || Number(ink) === 33) return "add";
  if (ink === "SCREEN" || Number(ink) === 3) return "screen";
  if (ink === "MULTIPLY") return "multiply";
  return "normal";
};

export interface IBaseFurniture {
  x: number;
  y: number;
  zIndex: number;
  alpha: number;
  highlight: boolean | string;
  activeWired: boolean;
}
