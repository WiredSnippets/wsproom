import { FurnitureLogicData } from "./FurnitureLogicData";
import { FurnitureLogic, IFurnitureLogicData } from "./interfaces/IFurnitureLogicData";

export class JsonFurnitureLogicData implements IFurnitureLogicData {
  constructor(private _logic: FurnitureLogicData) {}

  getLogic(type: string): FurnitureLogic | undefined {
    return this._logic.getLogic(type);
  }
  getLogics(): FurnitureLogic[] {
    return this._logic.getLogics();
  }

}
