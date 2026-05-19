import * as PIXI from "pixi.js";
import { EventManager } from "./EventManager";

export class EventManagerContainer {
  private _box: PIXI.TilingSprite | undefined;
  private _onPointerMove: (event: PIXI.InteractionEvent) => void;
  private _onPointerUp: (event: PIXI.InteractionEvent) => void;
  private _onPointerDown: (event: PIXI.InteractionEvent) => void;

  constructor(
    private _application: PIXI.Application,
    private _eventManager: EventManager
  ) {
    this._updateRectangle();

    _application.ticker.add(this._updateRectangle);

    const interactionManager: PIXI.InteractionManager = this._application
      .renderer.plugins.interaction;

    this._onPointerMove = (event: PIXI.InteractionEvent) => {
      const position = event.data.getLocalPosition(this._application.stage);
      this._eventManager.move(event, position.x, position.y);
    };
    this._onPointerUp = (event: PIXI.InteractionEvent) => {
      const position = event.data.getLocalPosition(this._application.stage);
      this._eventManager.pointerUp(event, position.x, position.y);
    };
    this._onPointerDown = (event: PIXI.InteractionEvent) => {
      const position = event.data.getLocalPosition(this._application.stage);
      this._eventManager.pointerDown(event, position.x, position.y);
    };

    interactionManager.addListener("pointermove", this._onPointerMove, true);
    interactionManager.addListener("pointerup", this._onPointerUp, true);
    interactionManager.addListener("pointerdown", this._onPointerDown, true);
  }

  destroy() {
    this._application.ticker.remove(this._updateRectangle);

    const interactionManager: PIXI.InteractionManager | undefined =
      this._application.renderer?.plugins?.interaction;
    if (interactionManager) {
      interactionManager.removeListener("pointermove", this._onPointerMove);
      interactionManager.removeListener("pointerup", this._onPointerUp);
      interactionManager.removeListener("pointerdown", this._onPointerDown);
    }
  }

  private _updateRectangle = () => {
    //this._box?.destroy();

    const renderer = this._application.renderer;
    const width = renderer.width / renderer.resolution;
    const height = renderer.height / renderer.resolution;

    this._box = new PIXI.TilingSprite(PIXI.Texture.WHITE, width, height);
    this._box.alpha = 0.3;

    //this._application.stage.addChild(this._box);
  };
}
