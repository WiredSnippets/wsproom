import type { Matrix } from "pixi.js";
import { IEventManagerNode } from "./IEventManagerNode";
import { IEventTarget } from "./IEventTarget";

export interface IEventManager {
  register(target: IEventTarget): IEventManagerNode;
  remove(target: IEventTarget): void;
  getCoordinateRootMatrix?(): Matrix | undefined;
}
