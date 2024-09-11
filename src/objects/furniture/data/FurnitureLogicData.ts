import { XmlData } from "../../../data/XmlData";
import { FurnitureLogicJson } from "./FurnitureLogicJson";
import {
  FurnitureLogic,
  IFurnitureLogicData,
} from "./interfaces/IFurnitureLogicData";

export class FurnitureLogicData
  extends XmlData
  implements IFurnitureLogicData {
  private _logic: FurnitureLogic | undefined;

  constructor(xml: string) {
    super(xml);

    this.parseObjectData();
  }

  private parseObjectData(): void {
    const objectDataElement = this.querySelector("objectData");
    if (!objectDataElement) return;

    const type = objectDataElement.getAttribute("type");
    if (!type) throw new Error("Invalid object type");

    const dimensionsElement = objectDataElement.querySelector("dimensions");
    const directions = Array.from(objectDataElement.querySelectorAll("direction")).map(
      (dir) => Number(dir.getAttribute("id"))
    );
    const particleSystemElement = objectDataElement.querySelector("particlesystem");

    this._logic = {
      type,
      dimensions: {
        x: Number(dimensionsElement?.getAttribute("x") ?? 0),
        y: Number(dimensionsElement?.getAttribute("y") ?? 0),
        z: Number(dimensionsElement?.getAttribute("z") ?? 0),
      },
      directions,
      particleSystemSize: particleSystemElement
        ? Number(particleSystemElement.getAttribute("size"))
        : undefined,
    };
  }

  toJson(): FurnitureLogicJson | undefined {

    if(!this._logic) return undefined;

    return this._logic;
  }

  getLogic(): FurnitureLogic | undefined {
    return this._logic;
  }

}
