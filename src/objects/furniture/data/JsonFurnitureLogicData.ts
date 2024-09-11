import { FurnitureLogicJson } from "./FurnitureLogicJson";
import { FurnitureLogic, IFurnitureLogicData } from "./interfaces/IFurnitureLogicData";

export class JsonFurnitureLogicData implements IFurnitureLogicData {
  constructor(private _logic: FurnitureLogicJson) {}

  getLogic(): FurnitureLogic | undefined {
    return {...this._logic};
  }

}
