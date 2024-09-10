export type {
  FurniDrawPart as DrawPart,
} from "./DrawDefinition";
export type { FurniDrawDefinition as DrawDefinition } from "./DrawDefinition";

export * from "./visualization/parseVisualization";

export function getCharFromLayerIndex(index: number) {
  return String.fromCharCode(97 + index);
}
