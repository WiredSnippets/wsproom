import * as PIXI from "pixi.js";
import { TileType } from "../../types/TileType";
import { Room } from "./Room";

const TILE_W = 64;
const TILE_H = 32;

// How many tiles to extend beyond the room boundary in each direction
const EXTEND = 8;

// Internal tile grid (existing room tiles)
const GRID_COLOR   = 0xffffff;
const GRID_ALPHA   = 0.22;

// External ghost tiles (beyond room boundary)
const EXT_COLOR    = 0x6699ff;
const EXT_ALPHA    = 0.08;
const EXT_LINE     = 0x6699ff;
const EXT_LINE_A   = 0.12;

// Hover
const HOVER_FILL   = 0x99ccff;
const HOVER_ALPHA  = 0.4;

// Selection rect
const SEL_FILL     = 0xffffff;
const SEL_ALPHA    = 0.28;
const SEL_LINE     = 0xffffff;
const SEL_LINE_A   = 0.9;

export type EditorPaintCallback = (
  tiles: Array<{ x: number; y: number }>,
  type: TileType,
  expandTo?: { minX: number; minY: number; maxX: number; maxY: number }
) => void;

interface TilePos {
  rx: number;
  ry: number;
  sx: number; // screen x in visualization space
  sy: number;
  external: boolean; // true = outside current tilemap bounds
}

export class TileMapEditorLayer extends PIXI.Container {
  private _gridInternal  = new PIXI.Graphics();
  private _gridExternal  = new PIXI.Graphics();
  private _selectionLayer = new PIXI.Graphics();
  private _hoverLayer    = new PIXI.Graphics();

  private _activeTile: TileType = "0" as TileType;
  private _tilemap: TileType[][] = [];
  private _tilePositions: TilePos[] = [];

  private _dragStart: TilePos | null = null;
  private _dragEnd:   TilePos | null = null;
  private _isPainting = false;
  private _lastHovered: TilePos | null = null;

  private _onPaint: EditorPaintCallback;
  private _room: Room;

  constructor(room: Room, onPaint: EditorPaintCallback) {
    super();
    this._room    = room;
    this._onPaint = onPaint;

    // Order: external ghost behind internal grid, selection + hover on top
    this.addChild(this._gridExternal);
    this.addChild(this._gridInternal);
    this.addChild(this._selectionLayer);
    this.addChild(this._hoverLayer);

    this._build();
    this._attachEvents();
  }

  setActiveTile(type: TileType) {
    this._activeTile = type;
  }

  refresh() {
    this._build();
    this._selectionLayer.clear();
    this._hoverLayer.clear();
    this._lastHovered = null;
    this._dragStart = null;
    this._dragEnd   = null;
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  private _isoPos(rx: number, ry: number) {
    return this._room.getPosition(rx, ry, 0);
  }

  private _build() {
    this._tilemap       = this._room.getTileMap();
    this._tilePositions = [];
    this._gridInternal.clear();
    this._gridExternal.clear();

    const rows    = this._tilemap.length;
    const cols    = rows > 0 ? this._tilemap[0].length : 0;

    // Bounds of walkable area (ignoring x-wall tiles)
    let minWalkX = Infinity, minWalkY = Infinity;
    let maxWalkX = -Infinity, maxWalkY = -Infinity;
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        if (this._tilemap[ry][rx] !== "x") {
          if (rx < minWalkX) minWalkX = rx;
          if (rx > maxWalkX) maxWalkX = rx;
          if (ry < minWalkY) minWalkY = ry;
          if (ry > maxWalkY) maxWalkY = ry;
        }
      }
    }
    if (minWalkX === Infinity) { minWalkX = 0; maxWalkX = 0; minWalkY = 0; maxWalkY = 0; }

    // Extended grid range
    const extMinX = minWalkX - EXTEND;
    const extMinY = minWalkY - EXTEND;
    const extMaxX = maxWalkX + EXTEND;
    const extMaxY = maxWalkY + EXTEND;

    // Internal tiles
    let _dbgLogged = false;
    this._gridInternal.lineStyle(0.8, GRID_COLOR, GRID_ALPHA);
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        if (this._tilemap[ry][rx] === "x") continue;
        const { x: sx, y: sy } = this._isoPos(rx, ry);
        if (!_dbgLogged) { console.log(`[TileMapEditor] first tile rx=${rx} ry=${ry} => sx=${sx} sy=${sy}`); _dbgLogged = true; }
        this._tilePositions.push({ rx, ry, sx, sy, external: false });
        this._drawDiamondLine(this._gridInternal, sx, sy);
      }
    }

    // External ghost tiles
    this._gridExternal.lineStyle(0.6, EXT_LINE, EXT_LINE_A);
    for (let ry = extMinY; ry <= extMaxY; ry++) {
      for (let rx = extMinX; rx <= extMaxX; rx++) {
        // Skip if already an internal tile
        const isInternal =
          ry >= 0 && ry < rows &&
          rx >= 0 && rx < cols &&
          this._tilemap[ry]?.[rx] !== "x";
        if (isInternal) continue;

        const { x: sx, y: sy } = this._isoPos(rx, ry);
        this._tilePositions.push({ rx, ry, sx, sy, external: true });

        // Fill ghost tile very subtly
        this._gridExternal.beginFill(EXT_COLOR, EXT_ALPHA);
        this._drawDiamondFill(this._gridExternal, sx, sy);
        this._gridExternal.endFill();
        this._drawDiamondLine(this._gridExternal, sx, sy);
      }
    }
  }

  // ─── Drawing helpers ───────────────────────────────────────────────────────

  private _drawDiamondLine(g: PIXI.Graphics, sx: number, sy: number) {
    // Matches TileCursor points: p1(0,16) p2(32,0) p3(64,16) p4(32,32)
    // sx/sy is top-left of the tile bounding box
    g.moveTo(sx,              sy + TILE_H / 2); // left
    g.lineTo(sx + TILE_W / 2, sy);              // top
    g.lineTo(sx + TILE_W,     sy + TILE_H / 2); // right
    g.lineTo(sx + TILE_W / 2, sy + TILE_H);     // bottom
    g.closePath();
  }

  private _drawDiamondFill(g: PIXI.Graphics, sx: number, sy: number) {
    g.moveTo(sx,              sy + TILE_H / 2);
    g.lineTo(sx + TILE_W / 2, sy);
    g.lineTo(sx + TILE_W,     sy + TILE_H / 2);
    g.lineTo(sx + TILE_W / 2, sy + TILE_H);
    g.closePath();
  }

  private _isErasing() {
    return this._activeTile === ("x" as TileType);
  }

  private _drawHover(tile: TilePos | null) {
    this._hoverLayer.clear();
    if (!tile) return;
    const color = this._isErasing() ? 0xff6666 : tile.external ? 0xffaa44 : HOVER_FILL;
    const lineColor = this._isErasing() ? 0xff6666 : 0xffffff;
    const lineAlpha = this._isErasing() ? 0.5 : 0.85;
    this._hoverLayer.beginFill(color, HOVER_ALPHA);
    this._hoverLayer.lineStyle(1, lineColor, lineAlpha);
    this._drawDiamondFill(this._hoverLayer, tile.sx, tile.sy);
    this._hoverLayer.endFill();
  }

  private _drawSelection(start: TilePos, end: TilePos) {
    this._selectionLayer.clear();
    const tiles = this._tilesInRect(start, end);
    const erasing = this._isErasing();
    for (const t of tiles) {
      const color = erasing ? 0xff6666 : t.external ? 0xffaa44 : SEL_FILL;
      const lineColor = erasing ? 0xff6666 : SEL_LINE;
      const lineAlpha = erasing ? 0.5 : SEL_LINE_A;
      this._selectionLayer.beginFill(color, SEL_ALPHA);
      this._selectionLayer.lineStyle(1, lineColor, lineAlpha);
      this._drawDiamondFill(this._selectionLayer, t.sx, t.sy);
      this._selectionLayer.endFill();
    }
  }

  // ─── Hit test ──────────────────────────────────────────────────────────────

  private _hitTest(canvasX: number, canvasY: number): TilePos | null {
    // Get the global (stage-space) position of this layer's origin
    // by using the world transform. This handles camera offsets correctly.
    const wt = (this as any).worldTransform;
    // wt.tx/ty = global position of local (0,0)
    // wt.a/b/c/d = scale/rotation (assumed no rotation, scale=1)
    // local = (canvasXY - wt.tx/ty) / scale
    const scaleX = wt ? wt.a : 1;
    const scaleY = wt ? wt.d : 1;
    const localX = wt ? (canvasX - wt.tx) / scaleX : canvasX;
    const localY = wt ? (canvasY - wt.ty) / scaleY : canvasY;

    let best: TilePos | null = null;
    let bestDist = Infinity;

    for (const tile of this._tilePositions) {
      const cx = tile.sx + TILE_W / 2;
      const cy = tile.sy + TILE_H / 2;
      const dx = Math.abs(localX - cx) / (TILE_W / 2);
      const dy = Math.abs(localY - cy) / (TILE_H / 2);
      if (dx + dy <= 1.05) {
        const dist = dx + dy;
        if (dist < bestDist) { bestDist = dist; best = tile; }
      }
    }
    return best;
  }

  private _tilesInRect(start: TilePos, end: TilePos): TilePos[] {
    const minX = Math.min(start.rx, end.rx);
    const maxX = Math.max(start.rx, end.rx);
    const minY = Math.min(start.ry, end.ry);
    const maxY = Math.max(start.ry, end.ry);
    return this._tilePositions.filter(
      (t) => t.rx >= minX && t.rx <= maxX && t.ry >= minY && t.ry <= maxY
    );
  }

  // ─── Commit paint ──────────────────────────────────────────────────────────

  private _commitPaint(start: TilePos, end: TilePos) {
    const tiles = this._tilesInRect(start, end);
    if (tiles.length === 0) return;

    const hasExternal = tiles.some((t) => t.external);

    if (hasExternal) {
      // Calculate how much the tilemap must expand to include all selected tiles
      const tilemap = this._room.getTileMap();
      const rows = tilemap.length;
      const cols = rows > 0 ? tilemap[0].length : 0;

      const allRX = tiles.map((t) => t.rx);
      const allRY = tiles.map((t) => t.ry);
      const selMinX = Math.min(...allRX);
      const selMinY = Math.min(...allRY);
      const selMaxX = Math.max(...allRX);
      const selMaxY = Math.max(...allRY);

      this._onPaint(
        tiles.map((t) => ({ x: t.rx, y: t.ry })),
        this._activeTile,
        { minX: selMinX, minY: selMinY, maxX: selMaxX, maxY: selMaxY }
      );
    } else {
      this._onPaint(
        tiles.map((t) => ({ x: t.rx, y: t.ry })),
        this._activeTile
      );
    }
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  private _attachEvents() {
    const view = this._room.application.view as HTMLCanvasElement;

    const onMove = (e: PointerEvent) => {
      const rect = view.getBoundingClientRect();
      const tile = this._hitTest(e.clientX - rect.left, e.clientY - rect.top);

      if (tile !== this._lastHovered) {
        this._lastHovered = tile;
        this._drawHover(tile);
      }

      if (this._isPainting && tile && this._dragStart) {
        this._dragEnd = tile;
        this._drawSelection(this._dragStart, this._dragEnd);
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = view.getBoundingClientRect();
      const tile = this._hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (!tile) return;
      this._isPainting = true;
      this._dragStart  = tile;
      this._dragEnd    = tile;
      this._drawSelection(tile, tile);
    };

    const onUp = () => {
      if (this._isPainting && this._dragStart && this._dragEnd) {
        this._commitPaint(this._dragStart, this._dragEnd);
      }
      this._isPainting = false;
      this._dragStart  = null;
      this._dragEnd    = null;
      this._selectionLayer.clear();
    };

    view.addEventListener("pointermove", onMove);
    view.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup",  onUp);

    (this as any)._cleanup = () => {
      view.removeEventListener("pointermove", onMove);
      view.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup",  onUp);
    };
  }

  destroy() {
    (this as any)._cleanup?.();
    super.destroy({ children: true });
  }
}
