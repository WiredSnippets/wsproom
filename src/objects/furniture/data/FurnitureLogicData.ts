import { XmlData } from "../../../data/XmlData";
import { FurnitureLogicJson } from "./FurnitureLogicJson";
import {
  FurnitureLogic,
  IFurnitureLogicData,
} from "./interfaces/IFurnitureLogicData";

export class FurnitureLogicData
  extends XmlData
  implements IFurnitureLogicData {
  private _logics = new Map<string, FurnitureLogic>();

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

    this._logics.set(type, {
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
    });
  }

  static async fromUrl(url: string) {
    const response = await fetch(url);
    const text = await response.text();

    return new FurnitureLogicData(text);
  }

  toJson(): FurnitureLogicJson {
    const logics = this.getLogics();
    const assetsObject: { [key: string]: FurnitureLogic } = {};


    logics.forEach((logic) => {
      assetsObject[logic.type] = logic;
    });

    return assetsObject;
  }

  getLogic(type: string): FurnitureLogic | undefined {
    return this._logics.get(type);
  }

  getLogics() {
    return Array.from(this._logics.values());
  }

}
