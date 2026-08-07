export type WallPosition = {
  /**
   * The x position of the wall tile the spot belongs to.
   */
  roomX: number;
  /**
   * The y position of the wall tile the spot belongs to.
   */
  roomY: number;
  /**
   * The horizontal offset in pixels within the wall tile.
   */
  offsetX: number;
  /**
   * The vertical offset in pixels within the wall tile.
   */
  offsetY: number;
  /**
   * Which of the two walls the spot sits on: `l` for the left wall
   * (a rowWall), `r` for the right wall (a colWall).
   */
  wall: "l" | "r";
};
