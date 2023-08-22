import { Room } from "@wiredsnippets/shroom";
import { TestRenderer } from "../../../../TestRenderer";

export function renderModel(tilemap: string): TestRenderer {
  return ({ shroom, application }) => {
    const room = Room.create(shroom, {
      tilemap: tilemap,
    });

    application.stage.addChild(room);
  };
}
