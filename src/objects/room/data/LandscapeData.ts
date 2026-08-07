import { XmlData } from "../../../data/XmlData";
import {
  LandscapeAnimationItem,
  LandscapeLayer,
  LandscapeVisualization,
} from "../Landscape";

/**
 * Reads the landscape planes out of the room visualization xml that ships
 * inside `room.swf`, and hands them over in the shape `Landscape` wants.
 *
 * Habbo writes item coordinates as percentages (`x="10%"`), so they arrive as
 * fractions of the whole landscape here.
 */
export class LandscapeData extends XmlData {
  private _planes: Element[];

  constructor(xml: string) {
    super(xml);

    this._planes = this._findPlanes();
  }

  private _findPlanes() {
    for (const selector of [
      "landscapeData planes plane",
      "landscapedata planes plane",
      "landscapeData plane",
      "landscapes landscape",
    ]) {
      const found = this.querySelectorAll(selector);
      if (found.length > 0) return found;
    }

    return [];
  }

  get ids() {
    return this._planes
      .map((plane) => plane.getAttribute("id"))
      .filter((id): id is string => id != null);
  }

  private _percent(value: string | null) {
    if (value == null || value.length === 0) return 0;

    const trimmed = value.endsWith("%") ? value.slice(0, -1) : value;
    const parsed = parseFloat(trimmed);

    if (isNaN(parsed)) return 0;

    return value.endsWith("%") ? parsed / 100 : parsed;
  }

  private _number(value: string | null) {
    if (value == null) return undefined;
    const parsed = Number(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private _attr(element: Element, ...names: string[]) {
    for (const name of names) {
      const value = element.getAttribute(name);
      if (value != null) return value;
    }
    return null;
  }

  /**
   * Resolves a material to the bitmap it tiles. Habbo materials are a matrix of
   * cell columns; the landscapes in practice use a single repeating texture, so
   * we take the first bitmap and tile that.
   */
  private _resolveMaterial(materialId: string | null) {
    if (materialId == null) return undefined;

    const material = this.querySelectorAll("material").find(
      (element) => element.getAttribute("id") === materialId
    );
    if (material == null) return undefined;

    const textureId = material
      .querySelector("cell")
      ?.getAttribute("textureId");
    if (textureId == null) return undefined;

    const texture = this.querySelectorAll("texture").find(
      (element) => element.getAttribute("id") === textureId
    );

    return (
      texture?.querySelector("bitmap")?.getAttribute("assetName") ?? undefined
    );
  }

  getVisualization(id: string, size = 64): LandscapeVisualization | undefined {
    const plane = this._planes.find(
      (element) => element.getAttribute("id") === id
    );
    if (plane == null) return undefined;

    const visualizations = Array.from(
      plane.querySelectorAll("animatedVisualization, visualization")
    );

    const visualization =
      visualizations.find(
        (element) => this._number(element.getAttribute("size")) === size
      ) ?? visualizations[0];

    if (visualization == null) return undefined;

    const layers: LandscapeLayer[] = [];

    Array.from(visualization.querySelectorAll("layer, animatedLayer")).forEach(
      (element) => {
        const items = Array.from(
          element.querySelectorAll("item, animationItem")
        );

        if (items.length > 0) {
          layers.push({
            items: items
              .map((item): LandscapeAnimationItem | undefined => {
                const asset = this._attr(item, "assetId", "asset");
                if (asset == null) return undefined;

                return {
                  asset,
                  x: this._percent(item.getAttribute("x")),
                  y: this._percent(item.getAttribute("y")),
                  randomX: this._percent(item.getAttribute("randomX")),
                  randomY: this._percent(item.getAttribute("randomY")),
                  speedX: this._number(item.getAttribute("speedX")) ?? 0,
                  speedY: this._number(item.getAttribute("speedY")) ?? 0,
                };
              })
              .filter((item): item is LandscapeAnimationItem => item != null),
          });
          return;
        }

        const align = element.getAttribute("align");

        layers.push({
          material: this._resolveMaterial(
            this._attr(element, "materialId", "material")
          ),
          color: this._number(element.getAttribute("color")),
          align: align === "top" || align === "bottom" ? align : undefined,
          offset: this._number(element.getAttribute("offset")),
        });
      }
    );

    return { layers };
  }

  toJson() {
    const result: Record<string, LandscapeVisualization> = {};

    this.ids.forEach((id) => {
      const visualization = this.getVisualization(id);
      if (visualization != null) result[id] = visualization;
    });

    return result;
  }
}
