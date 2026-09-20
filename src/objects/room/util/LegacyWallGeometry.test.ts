import { parseTileMapString } from "../../../util/parseTileMapString";
import { parseTileMap } from "../../../util/parseTileMap";
import { LegacyWallGeometry } from "./LegacyWallGeometry";

const geometry = () =>
  new LegacyWallGeometry(parseTileMap(parseTileMapString("xxxx\nx000\nx000\nxxxx")).tilemap);

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("a wall spot keeps its world position through the trip back", () => {
  const geo = geometry();

  for (const wall of ["l", "r"]) {
    for (const offsetX of [0, 8, 16, 24, 32]) {
      for (const offsetY of [-40, 0, 12, 37]) {
        const spot = { roomX: 1, roomY: 1, offsetX, offsetY, wall };
        const location = geo.getLocation(spot.roomX, spot.roomY, offsetX, offsetY, wall);
        const back = geo.getSpot(location.x, location.y, location.z, wall);
        const again = geo.getLocation(back.roomX, back.roomY, back.offsetX, back.offsetY, wall);

        expect(near(again.x, location.x)).toBe(true);
        expect(near(again.y, location.y)).toBe(true);
        expect(near(again.z, location.z)).toBe(true);
      }
    }
  }
});

// The cursor publishes the pointer's place on the wall face. offsetY counts down
// from the wall top, and the part's local y counts up from the floor line, so
// the wall's pixel height is the bridge between them: a pointer on the base line
// has to land on the tile's floor, not on the wall top.
test("a cursor on the wall's base line lands on the floor", () => {
  const geo = geometry();
  const pixelHeight = 3.6 * 32;

  for (const localX of [0, 8, 16, 24, 32]) {
    const baseY = 16 - localX / 2;
    const left = geo.getLocation(0, 1, localX, baseY + pixelHeight, "l");

    expect(Math.abs(left.z)).toBeLessThan(1e-9);
  }

  for (const localX of [-32, -24, -16, -8, 0]) {
    const baseY = 16 + localX / 2;
    const right = geo.getLocation(
      0,
      1,
      -localX,
      baseY + pixelHeight - 16 - localX,
      "r"
    );

    expect(Math.abs(right.z)).toBeLessThan(1e-9);
  }
});

