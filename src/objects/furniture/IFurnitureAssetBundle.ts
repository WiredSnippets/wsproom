import { HitTexture } from "../hitdetection/HitTexture";
import { IFurnitureAssetsData } from "./data/interfaces/IFurnitureAssetsData";
import { IFurnitureIndexData } from "./data/interfaces/IFurnitureIndexData";
import { IFurnitureLogicData } from "./data/interfaces/IFurnitureLogicData";
import { IFurnitureVisualizationData } from "./data/interfaces/IFurnitureVisualizationData";

export interface IFurnitureAssetBundle {
  getAssets(): Promise<IFurnitureAssetsData>;
  getVisualization(): Promise<IFurnitureVisualizationData>;
  getTexture(name: string): Promise<HitTexture>;
  getIndex(): Promise<IFurnitureIndexData>;
  getLogic(): Promise<IFurnitureLogicData>;
}
