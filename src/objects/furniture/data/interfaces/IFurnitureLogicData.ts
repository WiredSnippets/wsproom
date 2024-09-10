export interface IFurnitureLogicData {
  getLogic(type: string): FurnitureLogic | undefined;
  getLogics(): FurnitureLogic[];
}

export interface FurnitureLogic {
  type: string;
  dimensions: { x: number; y: number; z: number };
  directions: number[];
  particleSystemSize?: number;
}
