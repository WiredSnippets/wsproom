import { MaskNode } from "../../interfaces/IRoomVisualization";
import { IFurnitureRoomVisualization } from "./BaseFurniture";
import type * as PIXI from "pixi.js";

export class FurnitureRoomVisualization implements IFurnitureRoomVisualization {
  constructor(private _container: PIXI.Container) {}

  public get container() {
    return this._container;
  }

  static fromContainer(container: PIXI.Container) {
    return new FurnitureRoomVisualization(container);
  }

  addMask(): MaskNode {
    return {
      remove: () => {
        // Do nothing
      },
      update: () => {
        // Do nothing
      },
      sprite: null as any,
    };
  }
}
