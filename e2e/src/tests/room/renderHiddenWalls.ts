import { Room } from "@wiredsnippets/wsproom";
import { TestRenderer } from "../../TestRenderer";

export const renderHiddenWalls: TestRenderer = ({ wsproom, application }) => {
  const room = Room.create(wsproom, {
    tilemap: `
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxx000000x
        xxxxx000000x
        xxxx0000000x
        xxxxx000000x
        xxxxx000000x
        xxxxx000000x
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        xxxxxxxxxxxx
        `,
  });

  room.hideWalls = true;

  application.stage.addChild(room);
};
