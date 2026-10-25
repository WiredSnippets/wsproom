---
id: create-room
title: Create a room
---

import useBaseUrl from '@docusaurus/useBaseUrl';

The Room class is the most essential part of wsproom.

The simplest way to create a room is by using the following code.
This will create a 4x3 room.

```ts
import * as PIXI from "pixi.js";

import { Room, FloorFurniture, Avatar, Wsproom } from "@wiredsnippets/wsproom";

const view = document.querySelector("#root") as HTMLCanvasElement;
const application = new PIXI.Application({ view });

const wsproom = Wsproom.create({ application, resourcePath: "./resources" });
const room = Room.create(wsproom, {
  tilemap: `
   xxxxx
   x0000
   x0000
   x0000
   `,
});

room.x = 100;
room.y = 200;

application.stage.addChild(room);
```

## Result

Your room should now look like this.

<img alt="Docusaurus with Keytar" src={useBaseUrl('img/plain.png')} />
