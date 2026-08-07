import * as PIXI from "pixi.js";

import { Room } from "./Room";
import TWEEN, { Group, Tween } from '@tweenjs/tween.js';

const ZOOM_LEVELS = [0.5, 1, 2, 4, 8];
const ZOOM_DURATION = 180;

type ZoomTweenValues = { zoom: number; x: number; y: number };

export class RoomCamera extends PIXI.Container {
  private _state: RoomCameraState = { type: "WAITING" };
  private _enabled = true;

  private _offsets: { x: number; y: number } = { x: 0, y: 0 };
  private _animatedOffsets: { x: number; y: number } = { x: 0, y: 0 };

  private _container: PIXI.Container;
  private _parentContainer: PIXI.Container;

  private _tween: any;
  private _target: EventTarget;
  private isMobile: boolean = false;

  private _zoom = 1;
  private _zoomTween: Tween<ZoomTweenValues> | undefined;
  private _tweenGroup: Group;

  constructor(
    private readonly _room: Room,
    private readonly _parentBounds: () => PIXI.Rectangle,
    private readonly _options?: RoomCameraOptions
  ) {
    super();

    const target = this._options?.target ?? window;
    this._target = target;
    this.isMobile = screen.width < 600;

    this._parentContainer = new PIXI.Container();
    this._parentContainer.hitArea = this._parentBounds();
    this._parentContainer.eventMode = "static";

    this._container = new PIXI.Container({ isRenderGroup: true });
    this._container.addChild(this._room);
    this._parentContainer.addChild(this._container);

    this.addChild(this._parentContainer);

    // Activation of the camera is only triggered by a down event on the parent container.
    this._parentContainer.addListener("pointerdown", this._handlePointerDown);
    this._target.addEventListener(
      "pointermove",
      this._handlePointerMove as any
    );
    this._target.addEventListener("pointerup", this._handlePointerUp as any);

    if (this._options?.zoom?.enabled) {
      this._room.application.canvas.addEventListener(
        "wheel",
        this._handleWheel,
        { passive: false }
      );
    }

    this._tweenGroup = new Group();
    this._room.application.ticker.add(this._updateTweens);
  }

  static forScreen(room: Room, options?: RoomCameraOptions) {
    return new RoomCamera(room, () => room.application.screen, options);
  }

  setEnabled(enabled: boolean) {
    this._enabled = enabled;
    this._parentContainer.eventMode = enabled ? "static" : "none";
    if (!enabled) {
      this._state = { type: "WAITING" };
      this._updatePosition();
    }
  }

  destroy() {
    this._parentContainer.removeListener(
      "pointerdown",
      this._handlePointerDown
    );
    this._target.removeEventListener(
      "pointermove",
      this._handlePointerMove as any
    );
    this._target.removeEventListener("pointerup", this._handlePointerUp as any);
    this._room.application.canvas.removeEventListener(
      "wheel",
      this._handleWheel
    );
    this._zoomTween?.stop();
    this._tweenGroup.removeAll();
    this._room.application.ticker.remove(this._updateTweens);
  }

  public get container() : PIXI.Container {
    return this._container;
  }

  public get zoom() {
    return this._zoom;
  }

  public setZoom(value: number, anchor?: { x: number; y: number }) {
    const bounds = this._parentBounds();
    this._zoomTo(value, anchor ?? { x: bounds.width / 2, y: bounds.height / 2 });
  }

  private get _zoomLevels() {
    return this._options?.zoom?.levels ?? ZOOM_LEVELS;
  }

  private _updateTweens = () => {
    this._tweenGroup.update(TWEEN.now(), false);
  };

  private _handleWheel = (event: WheelEvent) => {
    if (!this._enabled || !this._options?.zoom?.enabled) return;
    event.preventDefault();

    const levels = this._zoomLevels;
    const index = levels.indexOf(this._zoom);
    const current = index >= 0
      ? index
      : levels.reduce(
          (best, level, i) =>
            Math.abs(level - this._zoom) < Math.abs(levels[best] - this._zoom) ? i : best,
          0
        );

    const next = event.deltaY < 0 ? current + 1 : current - 1;
    if (next < 0 || next >= levels.length) return;

    const box = this._room.application.canvas.getBoundingClientRect();
    this._zoomTo(levels[next], {
      x: event.clientX - box.x - this.parent!.worldTransform.tx,
      y: event.clientY - box.y - this.parent!.worldTransform.ty,
    });
  };

  private _zoomTo(target: number, anchor: { x: number; y: number }) {
    if (target === this._zoom) return;

    const roomX = (anchor.x - this._offsets.x) / this._zoom;
    const roomY = (anchor.y - this._offsets.y) / this._zoom;

    const previousZoom = this._zoom;
    this._zoom = target;
    const targetOffsets = this._clampOffsets({
      x: anchor.x - roomX * target,
      y: anchor.y - roomY * target,
    });
    this._zoom = previousZoom;

    this._zoomTween?.stop();

    const from: ZoomTweenValues = {
      zoom: this._zoom,
      x: this._offsets.x,
      y: this._offsets.y,
    };

    this._zoomTween = new Tween(from, this._tweenGroup)
      .to(
        { zoom: target, x: targetOffsets.x, y: targetOffsets.y },
        this._options?.zoom?.duration ?? ZOOM_DURATION
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate((object: ZoomTweenValues) => {
        this._zoom = object.zoom;
        this._offsets = { x: object.x, y: object.y };
        this._container.scale.set(object.zoom);
        this._updatePosition();
      })
      .onComplete(() => {
        this._zoom = target;
        this._offsets = targetOffsets;
        this._container.scale.set(target);
        this._updatePosition();
      })
      .start();
  }

  private _handlePointerUp = (event: PointerEvent) => {
    if (event.altKey || event.shiftKey || event.ctrlKey) return; // Block all modifier keys.
    
    if (this._state.type === "WAITING" || this._state.type === "ANIMATE_ZERO")
      return;

    if (this._state.pointerId !== event.pointerId) return;

    let animatingBack = false;

    if (this._state.type === "DRAGGING") {
      animatingBack = this._stopDragging(this._state);
    }

    if (!animatingBack) {
      this._resetDrag();
    }
  };

  private _handlePointerDown = (event: PIXI.FederatedPointerEvent) => {
    if (!this._enabled) return;
    if (event.nativeEvent.altKey ||
        event.nativeEvent.shiftKey ||
        event.nativeEvent.ctrlKey) return; // Block all modifier keys.

    const position = event.getLocalPosition(this.parent!);
    if (this._state.type === "WAITING") {
      this._enterWaitingForDistance(position, event.pointerId);
    } else if (this._state.type === "ANIMATE_ZERO") {
      this._changingDragWhileAnimating(position, event.pointerId);
    }
  };

  private _handlePointerMove = (event: PointerEvent) => {
    if (!this._enabled) return;

    const application = this._room.application;
    if (!application) return;

    const view = application.canvas;
    if (!view) return;

    const box = view.getBoundingClientRect();
    const position = new PIXI.Point(
      event.clientX - box.x - this.parent!.worldTransform.tx,
      event.clientY - box.y - this.parent!.worldTransform.ty
    );

    switch (this._state.type) {
      case "WAIT_FOR_DISTANCE": {
        this._tryUpgradeWaitForDistance(this._state, position, event.pointerId);
        break;
      }

      case "DRAGGING": {
        this._updateDragging(this._state, position, event.pointerId);
        break;
      }
    }
  };

  private _updatePosition() {
    switch (this._state.type) {
      case "DRAGGING": {
        // When dragging, the current position consists of the current offset of the camera
        // and the drag difference.

        const diffX = this._state.currentX - this._state.startX;
        const diffY = this._state.currentY - this._state.startY;

        this._container.x = this._offsets.x + diffX;
        this._container.y = this._offsets.y + diffY;
        break;
      }

      case "ANIMATE_ZERO": {
        // When animating back to the zero point, we use the animatedOffsets of the camera.

        this._container.x = this._animatedOffsets.x;
        this._container.y = this._animatedOffsets.y;
        break;
      }

      default: {
        // Default behavior: Use the set offsets of the camera.

        this._container.x = this._offsets.x;
        this._container.y = this._offsets.y;
      }
    }
  }

  private _clampOffsets(offsets: { x: number; y: number }) {
    if (!this._options?.bounded) return offsets;

    const bounds = this._parentBounds();
    const roomX = this.parent!.position.x + this._room.x * this._zoom;
    const roomY = this.parent!.position.y + this._room.y * this._zoom;
    const roomWidth = this._room.roomWidth * this._zoom;
    const roomHeight = this._room.roomHeight * this._zoom;

    const margin = Math.min(roomWidth, bounds.width) / 2;
    const marginY = Math.min(roomHeight, bounds.height) / 2;

    return {
      x: Math.min(
        Math.max(offsets.x, margin - roomX - roomWidth),
        bounds.width - roomX - margin
      ),
      y: Math.min(
        Math.max(offsets.y, marginY - roomY - roomHeight),
        bounds.height - roomY - marginY
      ),
    };
  }

  private _returnToZero(
    state: CameraDraggingState,
    current: { x: number; y: number }
  ) {
    this._state = {
      ...state,
      type: "ANIMATE_ZERO",
    };
    const duration = this._options?.duration ?? 500;

    const target = this._clampOffsets(current);

    this._animatedOffsets = current;
    this._offsets = target;

    const newPos = { ...this._animatedOffsets };

    const tween = new Tween(newPos, this._tweenGroup)
      .to({ x: target.x, y: target.y }, duration)
      .easing(TWEEN.Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
      .onUpdate((object: { x: number; y: number }, elapsed: number) => {
        this._animatedOffsets = object;

        if (elapsed >= 1) {
          this._state = { type: "WAITING" };
        }

        this._updatePosition();
      })
      .start();

    this._tween = tween;

    this._updatePosition();
  }

  private _stopDragging(state: CameraDraggingState) {
    const diffX = state.currentX - state.startX;
    const diffY = state.currentY - state.startY;

    const currentOffsets = {
      x: this._offsets.x + diffX,
      y: this._offsets.y + diffY,
    };

    const clamped = this._clampOffsets(currentOffsets);

    if (clamped.x !== currentOffsets.x || clamped.y !== currentOffsets.y) {
      this._returnToZero(state, currentOffsets);
      return true;
    }

    this._offsets = currentOffsets;

    return false;
  }

  private _resetDrag() {
    this._state = { type: "WAITING" };
    this._updatePosition();
  }

  private _changingDragWhileAnimating(position: PIXI.Point, pointerId: number) {
    this._offsets = this._animatedOffsets;
    this._animatedOffsets = { x: 0, y: 0 };
    this._tween.stop();

    this._state = {
      currentX: position.x,
      currentY: position.y,
      startX: position.x,
      startY: position.y,
      pointerId: pointerId,
      type: "DRAGGING",
      skipBoundsCheck: true,
    };

    this._updatePosition();
  }

  private _enterWaitingForDistance(position: PIXI.Point, pointerId: number) {
    this._state = {
      type: "WAIT_FOR_DISTANCE",
      pointerId: pointerId,
      startX: position.x,
      startY: position.y,
    };
  }

  private _tryUpgradeWaitForDistance(
    state: CameraWaitForDistanceState,
    position: PIXI.Point,
    pointerId: number
  ) {
    if (state.pointerId !== pointerId && !this.isMobile) return;

    const distance = Math.sqrt(
      (position.x - state.startX) ** 2 + (position.y - state.startY) ** 2
    );

    // When the distance of the pointer travelled more than 10px, start dragging.
    if (distance >= 10) {
      this._state = {
        currentX: position.x,
        currentY: position.y,
        startX: position.x,
        startY: position.y,
        pointerId: pointerId,
        type: "DRAGGING",
      };
      this._updatePosition();
    }
  }

  private _updateDragging(
    state: CameraDraggingState,
    position: PIXI.Point,
    pointerId: number
  ) {
    if (state.pointerId !== pointerId) return;

    this._state = {
      ...state,
      currentX: position.x,
      currentY: position.y,
    };

    this._updatePosition();
  }
}

type CameraDraggingState = {
  type: "DRAGGING";
  currentX: number;
  currentY: number;
  pointerId: number;
  startX: number;
  startY: number;
  skipBoundsCheck?: boolean;
};

type CameraAnimateZeroState = {
  type: "ANIMATE_ZERO";
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
};

type CameraWaitForDistanceState = {
  type: "WAIT_FOR_DISTANCE";
  startX: number;
  startY: number;
  pointerId: number;
};

type RoomCameraState =
  | { type: "WAITING" }
  | CameraWaitForDistanceState
  | CameraDraggingState
  | CameraAnimateZeroState;

type RoomCameraOptions = {
  duration?: number;
  target?: EventTarget;
  bounded?: boolean;
  zoom?: {
    enabled: boolean;
    levels?: number[];
    duration?: number;
  };
};
