import { Room } from "@wiredsnippets/wsproom";
import { TestRenderer } from "../../../../TestRenderer";

export function renderModel(tilemap: string): TestRenderer {
  return ({ wsproom, application }) => {
    const room = Room.create(wsproom, {
      tilemap: tilemap,
    });

    application.stage.addChild(room);
  };
}
