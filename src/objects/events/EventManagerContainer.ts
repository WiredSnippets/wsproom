import * as PIXI from "pixi.js";
import { EventManager } from "./EventManager";

export class EventManagerContainer {
  private _onPointerMove: (event: PIXI.FederatedPointerEvent) => void;
  private _onPointerUp: (event: PIXI.FederatedPointerEvent) => void;
  private _onPointerDown: (event: PIXI.FederatedPointerEvent) => void;

  constructor(
    private _application: PIXI.Application,
    private _eventManager: EventManager
  ) {
    const stage = this._application.stage;
    stage.eventMode = "static";
    stage.hitArea = this._application.screen;

    this._onPointerMove = (event: PIXI.FederatedPointerEvent) => {
      const position = stage.toLocal(event.global);
      this._eventManager.move(event, position.x, position.y);
    };
    this._onPointerUp = (event: PIXI.FederatedPointerEvent) => {
      const position = stage.toLocal(event.global);
      this._eventManager.pointerUp(event, position.x, position.y);
    };
    this._onPointerDown = (event: PIXI.FederatedPointerEvent) => {
      const position = stage.toLocal(event.global);
      this._eventManager.pointerDown(event, position.x, position.y);
    };

    stage.on("pointermove", this._onPointerMove);
    stage.on("pointerup", this._onPointerUp);
    stage.on("pointerdown", this._onPointerDown);
  }

  destroy() {
    const stage = this._application.stage;
    if (stage != null) {
      stage.off("pointermove", this._onPointerMove);
      stage.off("pointerup", this._onPointerUp);
      stage.off("pointerdown", this._onPointerDown);
    }
  }
}
