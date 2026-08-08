import { TileType } from "../../types/TileType";
import { getNumberOfTileType } from "../getTileInfo";

/**
 * Habbo does not look for wall edges tile by tile. It picks a single seed — the
 * first floor tile going down the leftmost column — and walks the outline of the
 * region that seed belongs to, turning at every corner until it arrives back
 * where it started. Everything the walk never reaches stays open, which is why a
 * room made of two disconnected floors only gets walls around one of them.
 *
 * The walk is run twice: once treating holes as outside the room, once treating
 * only the padding as outside. Comparing the two is what tells Habbo which
 * stretches sit next to a hole and have to be hidden.
 */

/** Anything below this is outside the room entirely. */
const BLOCKED = -110;
/** A gap in the floor: still inside the room's outline, but has no tile. */
const HOLE = -100;

const DIRECTION_VECTORS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const NORMAL_VECTORS = [
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
];

/** How far a single straight stretch of wall may run before we give up. */
const MAX_RUN = 1000;
/** How many corners one outline may have before we give up. */
const MAX_CORNERS = 1000;

export interface TracedWall {
  x: number;
  y: number;
  /** 0 = +x, 1 = +y, 2 = -x, 3 = -y. */
  direction: number;
  length: number;
  /** The stretch runs along the padding rather than along real floor. */
  border: boolean;
  leftTurn: boolean;
  hidden: boolean;
  /** The outline turns away from this stretch, so it is cut back on that side. */
  cutLeft?: boolean;
  cutRight?: boolean;
  /** The next stretch is drawn, so this one meets it instead of ending open. */
  joinsNext?: boolean;
  /** Sits on an outer corner rather than an inner one. */
  turnsOut?: boolean;
}

export interface TracedWalls {
  walls: TracedWall[];
  /** Height of the lowest floor the outline touches, per stretch. */
  heights: number[];
}

class HeightMatrix {
  private _values: number[][];
  public readonly width: number;
  public readonly height: number;

  /** Bounding box of the tiles that actually hold floor. */
  public readonly minX: number;
  public readonly maxX: number;
  public readonly minY: number;
  public readonly maxY: number;

  constructor(tilemap: TileType[][]) {
    this.width = tilemap.reduce((max, row) => Math.max(max, row.length), 0);
    this.height = tilemap.length;

    this._values = tilemap.map((row) => {
      const values = new Array<number>(this.width).fill(HOLE);

      row.forEach((tile, x) => {
        const parsed = getNumberOfTileType(tile);
        values[x] = parsed === "x" ? HOLE : parsed;
      });

      return values;
    });

    let minX = this.width;
    let maxX = -1;
    let minY = this.height;
    let maxY = -1;

    this._values.forEach((row, y) =>
      row.forEach((value, x) => {
        if (value <= HOLE) return;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      })
    );

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  /**
   * Anything off the map reads as blocked, which is what keeps the walk from
   * wandering: there is no padding ring, the bounds themselves are the edge.
   */
  get(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return BLOCKED;

    return this._values[y]?.[x] ?? BLOCKED;
  }

  get hasFloor() {
    return this.maxX >= 0;
  }
}

/**
 * Finds where the outline turns next. Each extractor runs along one side until
 * either the floor ends (turn inwards) or the floor beside it drops away (turn
 * outwards).
 */
const EXTRACTORS = [
  // Running along +x, floor on the +y side.
  (m: HeightMatrix, x: number, y: number, limit: number) => {
    for (let step = 1; step < MAX_RUN; step++) {
      if (m.get(x + step, y) > limit) return { x: x + step - 1, y };
      if (m.get(x + step, y + 1) <= limit) return { x: x + step, y: y + 1 };
    }
    return undefined;
  },
  // Running along +y, floor on the -x side.
  (m: HeightMatrix, x: number, y: number, limit: number) => {
    for (let step = 1; step < MAX_RUN; step++) {
      if (m.get(x, y + step) > limit) return { x, y: y + step - 1 };
      if (m.get(x - 1, y + step) <= limit) return { x: x - 1, y: y + step };
    }
    return undefined;
  },
  // Running along -x, floor on the -y side.
  (m: HeightMatrix, x: number, y: number, limit: number) => {
    for (let step = 1; step < MAX_RUN; step++) {
      if (m.get(x - step, y) > limit) return { x: x - step + 1, y };
      if (m.get(x - step, y - 1) <= limit) return { x: x - step, y: y - 1 };
    }
    return undefined;
  },
  // Running along -y, floor on the +x side.
  (m: HeightMatrix, x: number, y: number, limit: number) => {
    for (let step = 1; step < MAX_RUN; step++) {
      if (m.get(x, y - step) > limit) return { x, y: y - step + 1 };
      if (m.get(x + 1, y - step) <= limit) return { x: x + 1, y: y - step };
    }
    return undefined;
  },
];

function isDuplicate(walls: TracedWall[], candidate: TracedWall) {
  return walls.some(
    (wall) =>
      wall.x === candidate.x &&
      wall.y === candidate.y &&
      wall.direction === candidate.direction &&
      wall.length === candidate.length &&
      wall.border === candidate.border &&
      wall.leftTurn === candidate.leftTurn
  );
}

/**
 * @param treatHolesAsOutside walks the outline Habbo actually renders, where a
 * gap in the floor ends the room. The other pass keeps holes on the inside, and
 * comparing the two is what reveals which stretches border a hole.
 */
function traceOutline(
  matrix: HeightMatrix,
  seed: { x: number; y: number },
  treatHolesAsOutside: boolean
): TracedWall[] {
  const limit = treatHolesAsOutside ? HOLE : BLOCKED;
  const walls: TracedWall[] = [];

  let direction = 0;
  let corner = { ...seed };

  for (let guard = 0; guard < MAX_CORNERS; guard++) {
    // Marks a stretch that runs outside the floor's bounding box. It does not
    // stop the walk — it only tells hidePeninsulas where a chain begins.
    const outside =
      corner.x < matrix.minX ||
      corner.x > matrix.maxX ||
      corner.y < matrix.minY ||
      corner.y > matrix.maxY;

    const next = EXTRACTORS[direction](matrix, corner.x, corner.y, limit);
    if (next == null) return walls;

    const startedAt = direction;
    let length =
      Math.abs(next.x - corner.x) + Math.abs(next.y - corner.y);
    let leftTurn = false;

    if (corner.x === next.x || corner.y === next.y) {
      direction = (direction - 1 + EXTRACTORS.length) % EXTRACTORS.length;
      length++;
      leftTurn = true;
    } else {
      direction = (direction + 1) % EXTRACTORS.length;
      length--;
    }

    const wall: TracedWall = {
      x: corner.x,
      y: corner.y,
      direction: startedAt,
      length,
      border: outside,
      leftTurn,
      hidden: false,
    };

    if (!isDuplicate(walls, wall)) walls.push(wall);

    const closed =
      next.x === seed.x &&
      next.y === seed.y &&
      (next.x !== corner.x || next.y !== corner.y);

    corner = next;

    if (closed) break;
  }

  return walls;
}

/**
 * Hides stretches that only exist because the outline poked out into a
 * one-tile-wide spur. Habbo counts left turns along a run of non-border walls;
 * more than one outstanding left turn means the walk doubled back on itself.
 */
function hidePeninsulas(walls: TracedWall[]) {
  let index = 0;

  while (index < walls.length) {
    const from = index;
    let to = index;
    let outstandingLeftTurns = 0;
    let doubledBack = false;

    while (index < walls.length && !walls[index].border) {
      if (walls[index].leftTurn) {
        outstandingLeftTurns++;
      } else if (outstandingLeftTurns > 0) {
        outstandingLeftTurns--;
      }

      if (outstandingLeftTurns > 1) doubledBack = true;

      to = index;
      index++;
    }

    if (doubledBack) {
      for (let hide = from; hide <= to; hide++) walls[hide].hidden = true;
    }

    index++;
  }
}

/**
 * Trims stretches that run alongside a hole. A stretch that starts over a hole
 * is pushed forward to where the floor begins; one that runs into a hole is cut
 * short; one that is over a hole the whole way is dropped.
 */
function trimAgainstHoles(matrix: HeightMatrix, walls: TracedWall[]) {
  walls.forEach((wall) => {
    if (wall.hidden) return;

    const along = DIRECTION_VECTORS[wall.direction];
    const normal = NORMAL_VECTORS[wall.direction];
    let leadingHoles = 0;

    for (let step = 0; step < wall.length; step++) {
      const height = matrix.get(
        wall.x + step * along.x + normal.x,
        wall.y + step * along.y + normal.y
      );

      if (height === HOLE) {
        if (step > 0 && leadingHoles === 0) {
          wall.length = step;
          return;
        }
        leadingHoles++;
      } else if (leadingHoles > 0) {
        wall.x += leadingHoles * along.x;
        wall.y += leadingHoles * along.y;
        wall.length -= leadingHoles;
        return;
      }
    }

    if (leadingHoles === wall.length) wall.hidden = true;
  });
}

/** Lowest floor height the stretch runs against, which sets how tall it is. */
function heightOf(matrix: HeightMatrix, wall: TracedWall) {
  const along = DIRECTION_VECTORS[wall.direction];
  const normal = NORMAL_VECTORS[wall.direction];
  let lowest = -1;

  for (let step = 0; step < wall.length; step++) {
    const height = matrix.get(
      wall.x + step * along.x + normal.x,
      wall.y + step * along.y + normal.y
    );

    if (height >= 0 && (height < lowest || lowest < 0)) lowest = height;
  }

  return lowest < 0 ? 0 : lowest;
}

/**
 * The walk has to start just outside the room, on the tile above the first
 * floor of the leftmost column that holds any.
 */
function findSeed(matrix: HeightMatrix) {
  if (!matrix.hasFloor) return undefined;

  // Walk down the leftmost column that holds floor and stop one tile short of
  // it, so the walk begins just outside the room.
  for (let y = matrix.minY; y <= matrix.maxY; y++) {
    if (matrix.get(matrix.minX, y) > HOLE) return { x: matrix.minX, y: y - 1 };
  }

  return undefined;
}

const endPointOf = (wall: TracedWall) => {
  const along = DIRECTION_VECTORS[wall.direction];

  return {
    x: wall.x + along.x * wall.length,
    y: wall.y + along.y * wall.length,
  };
};

/**
 * Finds the stretch of the untrimmed outline that the given stretch sits on.
 * Both have to be colinear, and the original has to span the whole of it.
 */
function findOriginal(
  from: { x: number; y: number },
  to: { x: number; y: number },
  original: TracedWall[]
) {
  const verticalRun = from.x === to.x;
  const horizontalRun = from.y === to.y;

  if (!verticalRun && !horizontalRun) return -1;

  const low = verticalRun ? Math.min(from.y, to.y) : Math.min(from.x, to.x);
  const high = verticalRun ? Math.max(from.y, to.y) : Math.max(from.x, to.x);

  return original.findIndex((wall) => {
    const end = endPointOf(wall);

    if (verticalRun) {
      if (wall.x !== from.x || end.x !== from.x) return false;
      return Math.min(wall.y, end.y) <= low && high <= Math.max(wall.y, end.y);
    }

    if (wall.y !== from.y || end.y !== from.y) return false;
    return Math.min(wall.x, end.x) <= low && high <= Math.max(wall.x, end.x);
  });
}

/**
 * Carries the spur verdict from the untrimmed outline over to the one that is
 * actually drawn. A stretch that cannot be matched back at all only exists
 * because a hole cut it loose, so it goes too.
 */
function hideOriginallyHidden(walls: TracedWall[], original: TracedWall[]) {
  walls.forEach((wall) => {
    if (wall.hidden) return;

    const at = findOriginal({ x: wall.x, y: wall.y }, endPointOf(wall), original);

    if (at >= 0 && original[at].hidden) wall.hidden = true;
  });
}

/**
 * A stretch is cut back on the side where the outline turns away from it. Habbo
 * reads the turn from the untrimmed outline when the stretch can be found
 * there, so a wall that got shortened by a hole still joins its neighbours the
 * way the full room would.
 */
function resolveCuts(walls: TracedWall[], original: TracedWall[]) {
  walls.forEach((wall, index) => {
    const source =
      findOriginal({ x: wall.x, y: wall.y }, endPointOf(wall), original) >= 0
        ? original
        : walls;

    const at = source === original
      ? findOriginal({ x: wall.x, y: wall.y }, endPointOf(wall), original)
      : index;

    const after = source[(at + 1) % source.length];
    const before = source[(at - 1 + source.length) % source.length];

    wall.cutRight = !walls[(index - 1 + walls.length) % walls.length].leftTurn;
    wall.cutLeft = !wall.leftTurn;
    wall.joinsNext = !walls[(index + 1) % walls.length].hidden;
    wall.turnsOut =
      (after.direction - wall.direction + 4) % 4 === 3 ||
      (wall.direction - before.direction + 4) % 4 === 3;
  });
}

export function traceWalls(tilemap: TileType[][]): TracedWalls {
  const matrix = new HeightMatrix(tilemap);

  // Habbo seeds the walk from its own minX, which is the first column that
  // holds any floor at all — not column zero, since the model is usually padded
  // with empty tiles on the left.
  const seed = findSeed(matrix);

  if (seed == null) return { walls: [], heights: [] };

  // The outline Habbo renders, where a gap in the floor ends the room.
  const walls = traceOutline(matrix, seed, true);
  // The same walk with holes kept inside, which is how a shortened stretch can
  // still be matched back to the run it belongs to.
  const original = traceOutline(matrix, seed, false);

  // Each pass works on its own outline. Spurs are judged on the untrimmed walk,
  // where a one-tile finger still shows as one; holes are trimmed on the walk
  // that stops at them; and only then is the verdict carried across.
  hidePeninsulas(original);
  trimAgainstHoles(matrix, walls);
  hideOriginallyHidden(walls, original);
  resolveCuts(walls, original);

  const visible = walls.filter((wall) => !wall.hidden);

  return {
    walls: visible,
    heights: visible.map((wall) => heightOf(matrix, wall)),
  };
}
