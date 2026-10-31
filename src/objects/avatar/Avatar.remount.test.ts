import { Avatar } from "./Avatar";

test("destroyed leaves the avatar with fresh sprites so it can be re-added", () => {
  const avatar = new Avatar({ look: "hd-180-1", roomX: 1, roomY: 1, roomZ: 0, direction: 2 });
  const before = (avatar as any)._loadingAvatarSprites;

  avatar.destroyed();

  const after = (avatar as any)._loadingAvatarSprites;
  expect(after).not.toBe(before);
  expect(before.destroyed).toBe(true);
  expect(after.destroyed).toBe(false);
  expect((avatar as any)._cancelAnimation).toBeUndefined();
});
