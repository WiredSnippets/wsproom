export interface IFurnitureLogicData {
  getLogic(): FurnitureLogic | undefined;
}

export interface FurnitureLogic {
  type: string;
  dimensions: { x: number; y: number; z: number };
  directions: number[];
  particleSystemSize?: number;
}
