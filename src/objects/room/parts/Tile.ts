import * as PIXI from "pixi.js";

import { getFloorMatrix, getLeftMatrix, getRightMatrix } from "../matrixes";
import { IRoomPart } from "./IRoomPart";
import { RoomPartData } from "./RoomPartData";

interface Props {
  edge?: boolean;
  tileHeight: number;
  color: string;
  texture?: PIXI.Texture;
  door?: boolean;
  showBorders: {
    showLeftBorder: boolean;
    showRightBorder: boolean;
  };
}

export class Tile extends PIXI.Container implements IRoomPart {
  private _texture: PIXI.Texture | undefined;
  private _color: string | undefined;

  private _tileHeight: number;
  private _roomPartData: RoomPartData | undefined;
  private _tilePositions: PIXI.Point = new PIXI.Point(0, 0);
  private _showBorders: {
    showLeftBorder: boolean;
    showRightBorder: boolean;
  } = { showLeftBorder: true, showRightBorder: true};

  get color() {
    return this._color;
  }

  set color(value) {
    this._color = value;
    this._updateSprites();
  }

  public get tilePositions() {
    return this._tilePositions;
  }

  public set tilePositions(value) {
    this._tilePositions = value;
    this._updateSprites();
  }

  public get tileHeight() {
    return this._tileHeight;
  }

  public set tileHeight(value) {
    this._tileHeight = value;
    this._updateSprites();
  }

  constructor(private props: Props) {
    super();

    this._texture = props.texture;
    this._color = props.color;
    this._tileHeight = props.tileHeight;
    this._showBorders = props.showBorders;

    this._updateSprites();
  }

  update(data: RoomPartData): void {
    this.tileHeight = data.tileHeight;
    this._roomPartData = data;
    this._texture = data.tileTexture;
    this._updateSprites();
  }

  private _updateSprites() {
    this.removeChildren();
    const tileMatrix = getFloorMatrix(0, 0);

    const top = new PIXI.Graphics()
      .moveTo(0, 0)
      .lineTo(32, -16)
      .lineTo(64, 0)
      .lineTo(32, 16)
      .lineTo(0, 0)
      .fill({
        textureSpace: "global",
        texture: this._texture ?? PIXI.Texture.WHITE,
        color: this._roomPartData?.tileTopColor ?? 0,
        matrix: new PIXI.Matrix(1, 0.5, 1, -0.5, 0, 0),
      });

    top.position.set(tileMatrix.tx, tileMatrix.ty);
    this.addChild(top);

    if (this._showBorders.showLeftBorder) {
      const borderLeftMatrix = getLeftMatrix(0, 0, {
        width: 32,
        height: this.tileHeight,
      });

      const left: PIXI.Graphics = new PIXI.Graphics()
        .moveTo(0, 0)
        .lineTo(0, this.tileHeight)
        .lineTo(32, 16 + this.tileHeight)
        .lineTo(32, 16)
        .fill({
          textureSpace: "global",
          texture: this._texture ?? PIXI.Texture.WHITE,
          color: this._roomPartData?.tileLeftColor ?? 0,
          matrix: borderLeftMatrix,
        });
      left.position.set(0, 16);
      this.addChild(left);
    }
    
    if (this._showBorders.showRightBorder) {
      const borderRightMatrix = getRightMatrix(0, 0, {
        width: 32,
        height: this.tileHeight,
      });
      const right: PIXI.Graphics = new PIXI.Graphics()
        .moveTo(32, 16)
        .lineTo(32, 16 + this.tileHeight)
        .lineTo(64, this.tileHeight)
        .lineTo(64, 0)
        .lineTo(32, 16)
        .fill({
          textureSpace: "global",
          texture: this._texture ?? PIXI.Texture.WHITE,
          color: this._roomPartData?.tileRightColor ?? 0,
          matrix: borderRightMatrix,
        });

      right.position.set(0, 16);
      this.addChild(right);
    }
  }
}
