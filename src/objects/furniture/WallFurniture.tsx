import { RoomObject } from "../RoomObject";
import { getZOrder } from "../../util/getZOrder";
import { BaseFurniture } from "./BaseFurniture";
import { getMaskId } from "../room/util/getMaskId";
import { FurnitureFetchInfo } from "./FurnitureFetchInfo";
import { getFurnitureFetch } from "./util/getFurnitureFetch";
import { FurnitureId } from "../../interfaces/IFurnitureData";
import { LegacyWallGeometry } from "../room/util/LegacyWallGeometry";

export class WallFurniture extends RoomObject {
  public readonly placementType = "wall";

  private _baseFurniture: BaseFurniture;
  private readonly _type: string | undefined;
  private readonly _id: FurnitureId | undefined;
  private _roomX: number;
  private _roomY: number;

  private _offsetX = 0;
  private _offsetY = 0;

  /**
   * Absolute room height of the item, as Habbo ships it in the `a=` field of the
   * wall location. When it is there we use it directly: it is the same value the
   * server derived the offsets from, so it spares us guessing the height of the
   * tile the item hangs on — which is exactly where a room model that only
   * stores walkable tiles falls short.
   */
  private _altitude: number | undefined;

  constructor(
    options: {
      roomX: number;
      roomY: number;
      offsetX: number;
      offsetY: number;
      direction: number;
      animation?: string;
      altitude?: number;
    } & FurnitureFetchInfo
  ) {
    super();

    this._type = options.type;
    this._id = options.id;

    this._roomX = options.roomX;
    this._roomY = options.roomY;

    this._offsetX = options.offsetX;
    this._offsetY = options.offsetY;
    this._altitude = options.altitude;

    this._baseFurniture = new BaseFurniture({
      animation: options.animation,
      direction: options.direction,
      type: getFurnitureFetch(options, "wall"),
      getMaskId: (direction) =>
        this._touchesWall(direction)
          ? getMaskId(direction, this.roomX, this.roomY)
          : undefined,
    });
  }

  /**
   * Moves the furniture to another spot on the walls.
   *
   * @param roomX New x-Position
   * @param roomY New y-Position
   * @param offsetX New x-Offset within the wall tile
   * @param offsetY New y-Offset within the wall tile
   */
  move(roomX: number, roomY: number, offsetX: number, offsetY: number) {
    if (
      this._roomX === roomX &&
      this._roomY === roomY &&
      this._offsetX === offsetX &&
      this._offsetY === offsetY
    ) {
      return;
    }

    this._roomX = roomX;
    this._roomY = roomY;
    this._offsetX = offsetX;
    this._offsetY = offsetY;

    this._updatePosition();
  }

  public get extradata() {
    return this._baseFurniture.extradata;
  }

  public get validDirections() {
    return this._baseFurniture.validDirections;
  }

  public get validAnimations() {
    return this._baseFurniture.validAnimations;
  }

  public get height() {
    return this._baseFurniture.height;
  }

  public get id() {
    return this._id;
  }

  public get highlight() {
    return this._baseFurniture.highlight;
  }

  public set highlight(value) {
    this._baseFurniture.highlight = value;
  }

  public get activeWired() {
    return this._baseFurniture.activeWired;
  }

  public set activeWired(value) {
    this._baseFurniture.activeWired = value;
  }

  public get alpha() {
    return this._baseFurniture.alpha;
  }

  public set alpha(value: number) {
    this._baseFurniture.alpha = value;
  }

  public get type() {
    return this._type;
  }

  public get animation() {
    return this._baseFurniture.animation;
  }

  public set animation(value) {
    this._baseFurniture.animation = value;
  }

  public get direction() {
    return this._baseFurniture.direction;
  }

  public set direction(value) {
    this._baseFurniture.direction = value;
  }

  public get roomX() {
    return this._roomX;
  }

  public set roomX(value) {
    this._roomX = value;
    this._updatePosition();
  }

  public get roomY() {
    return this._roomY;
  }

  public set roomY(value) {
    this._roomY = value;
    this._updatePosition();
  }

  public get offsetX() {
    return this._offsetX;
  }
  public set offsetX(value) {
    this._offsetX = value;
    this._updatePosition();
  }

  public get offsetY() {
    return this._offsetY;
  }

  public set offsetY(value) {
    this._offsetY = value;
    this._updatePosition();
  }

  public get visualization() {
    return this._baseFurniture.visualization;
  }

  public set visualization(value) {
    this._baseFurniture.visualization = value;
  }

  public get onClick() {
    return this._baseFurniture.onClick;
  }

  public set onClick(value) {
    this._baseFurniture.onClick = value;
  }

  public get onDoubleClick() {
    return this._baseFurniture.onDoubleClick;
  }

  public set onDoubleClick(value) {
    this._baseFurniture.onDoubleClick = value;
  }

  public get onPointerDown() {
    return this._baseFurniture.onPointerDown;
  }

  public set onPointerDown(value) {
    this._baseFurniture.onPointerDown = value;
  }

  public get onPointerUp() {
    return this._baseFurniture.onPointerUp;
  }

  public set onPointerUp(value) {
    this._baseFurniture.onPointerUp = value;
  }

  public get onPointerOver() {
    return this._baseFurniture.onPointerOver;
  }

  public set onPointerOver(value) {
    this._baseFurniture.onPointerOver = value;
  }

  public get onPointerOut() {
    return this._baseFurniture.onPointerOut;
  }

  public set onPointerOut(value) {
    this._baseFurniture.onPointerOut = value;
  }

  destroyed(): void {
    this._baseFurniture.destroy();
  }

  registered(): void {
    this._baseFurniture.dependencies = {
      animationTicker: this.animationTicker,
      furnitureLoader: this.furnitureLoader,
      placeholder: undefined,
      configuration: this.configuration,
      visualization: this.roomVisualization,
      eventManager: this.eventManager,
    };

    this._updatePosition();
  }

  /**
   * A window only reveals the landscape while it sits in an actual wall plane —
   * see RoomVisualization.updateRoomPlaneMasks, which binds a mask to a plane
   * only when the object lies in it. Items dragged out into the room have no
   * plane to cut open, so their glass stays transparent.
   */
  private _touchesWall(direction: number) {
    const row = this.room?.getParsedTileTypes()?.[this.roomY];
    const tile = row?.[this.roomX];
    if (tile?.type !== "wall") return false;

    switch (tile.kind) {
      case "innerCorner":
      case "outerCorner":
        return true;
      case "rowWall":
        return direction === 2 || direction === 6;
      case "colWall":
        return direction === 0 || direction === 4;
    }
  }

  private _getOffsets(direction: number) {
    const geo = new LegacyWallGeometry(this.room.getParsedTileTypes());
    const roomPosition = geo.getLocation(
      this.roomX,
      this.roomY,
      this._offsetX,
      this._offsetY,
      direction === 2 ? "l" : "r"
    );
    return this.room.getPosition(
      roomPosition.x,
      roomPosition.y,
      this._altitude ?? roomPosition.z
    );
  }

  public get altitude() {
    return this._altitude;
  }

  public set altitude(value) {
    this._altitude = value;
    this._updatePosition();
  }

  private _updatePosition() {
    const position = this._getOffsets(this.direction);
    if (position == null) return;

    this._baseFurniture.x = position.x;
    this._baseFurniture.y = position.y;
    this._baseFurniture.zIndex = getZOrder(this.roomX, this.roomY, 0) - 1;
  }
}
