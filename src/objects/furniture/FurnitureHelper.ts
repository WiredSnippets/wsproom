import * as PIXI from "pixi.js";
import { Shroom } from "../Shroom";
import { BaseFurniture } from "./BaseFurniture";
import { IFurnitureExtended } from "./IFurniture";

export class FurnitureHelper {
  public static getFurniPreview(furniId: string, shroom: Shroom): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const container = new PIXI.Container();

      BaseFurniture.fromShroom(shroom, container, {
        animation: "0",
        direction: 2,
        type: { type: furniId, kind: "type" },
        onLoad: async () => {
          const image = (await shroom.dependencies.application.renderer.extract.image(container)) as HTMLImageElement;

          resolve(image);
          container.destroy();
        },
      });
    });
  }

  public static getFurniIcon(furniId: string, shroom: Shroom): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const container = new PIXI.Container();

      BaseFurniture.fromShroom(shroom, container, {
        animation: "0",
        direction: 2,
        type: { type: furniId, kind: "type" },
        onLoad: async () => {
          const image = (await shroom.dependencies.application.renderer.extract.image(container)) as HTMLImageElement;

          resolve(image);
          container.destroy();
        },
      });
  });
  }

  public static async getFurniOptions(furni: IFurnitureExtended, shroom: Shroom): Promise<FurniOptions | undefined> {
    if (!furni.type) return; // If Furniture Type == Undefined, Return Undefined
    const info = await shroom.dependencies.furnitureData?.getInfo(furni.type);
    if (!info) return; // If FurnitureData Fetch Fails, Return Undefined

    const image = (await this.getFurniPreview(furni.type, shroom)).src;
    const validDirections = await furni.validDirections;

    return {
      name: info?.name,
      type: furni.type,
      description: info?.description,
      image,

      move: (callback) => { callback(); },
      rotate: () => { furni.rotate(); },
      pickup: (callback) => { callback(); },
    };
  }
}

interface FurniOptions {
  name?: string;
  type: string;
  description?: string;
  image: string;
  move: (callback: () => void) => void;
  rotate: () => void;
  pickup: (callback: () => void) => void;
}