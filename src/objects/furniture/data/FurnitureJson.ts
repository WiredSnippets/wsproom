import { FurnitureAssetsJson } from "./FurnitureAssetsJson";
import { FurnitureIndexJson } from "./FurnitureIndexJson";
import { FurnitureLogicJson } from "./FurnitureLogicJson";
import { FurnitureVisualizationJson } from "./FurnitureVisualizationJson";

export interface FurnitureJson {
  visualization: FurnitureVisualizationJson;
  logic: FurnitureLogicJson;
  assets: FurnitureAssetsJson;
  index: FurnitureIndexJson;
  spritesheet: any;
}
