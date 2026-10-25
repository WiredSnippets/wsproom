# 🍄 wsproom

**A modern isometric room rendering engine, built on PixiJS v8.**

[![npm](https://img.shields.io/npm/v/@wiredsnippets/wsproom?color=8b5cf6)](https://www.npmjs.com/package/@wiredsnippets/wsproom)
[![License: LGPL v3](https://img.shields.io/badge/license-LGPL--3.0-blue.svg)](./COPYING.LESSER)
[![PixiJS](https://img.shields.io/badge/PixiJS-v8-e72264)](https://pixijs.com)

wsproom renders rooms, furniture, avatars and wall items in the browser.

## ✨ Features

- **PixiJS v8** rendering.
- **Nitro-accurate tilemaps**, with wall tracing, contour processing and door handling.
- **Room camera** with zoom, tweening and optional bounds clamping.
- **Furniture**: floor and wall items, altitude and movement, mask sprites, ink/blend modes,
  z-index control, `setPosition`, `dimensions`, `validAnimations`.
- **Highlight and active-wired filters** for furniture.
- **Precise hit detection** that accounts for scale, with a drag threshold so drags don't count as clicks.
- **Avatars** with actions, effects and pathfinding.

## 📦 Install

```bash
pnpm add @wiredsnippets/wsproom pixi.js
```

## 🚀 Quick start

```ts
import { Application } from "pixi.js";
import { Wsproom, Room, FloorFurniture, Avatar } from "@wiredsnippets/wsproom";

const app = new Application();
await app.init({ resizeTo: window });
document.body.appendChild(app.canvas);

const wsproom = Wsproom.create({ application: app, resourcePath: "./resources" });

const room = Room.create(wsproom, {
  tilemap: `
    xxxxx
    x0000
    x0000
    x0000
  `,
});

room.addRoomObject(
  new FloorFurniture({ roomX: 1, roomY: 1, roomZ: 0, direction: 2, type: "club_sofa" })
);
room.addRoomObject(
  new Avatar({ look: "hd-180-1.hr-100-61.ch-210-66.lg-270-82.sh-290-80", roomX: 2, roomY: 2, roomZ: 0, direction: 2 })
);

app.stage.addChild(room);
```

## 🧰 Dumping assets

Extract the resources wsproom needs from an external variables file:

```bash
npx wsproom dump --url https://example.com/gamedata/external_variables.txt --location ./resources
```

## 💜 Credits

wsproom is built on **[Shroom](https://github.com/jankuss/shroom)** by **[Jankuss](https://github.com/jankuss)**.
The core architecture and much of the codebase are Jankuss's work, and without it this project
wouldn't exist. Huge thanks, Jankuss. 🍄

Maintained by [WiredSnippets](https://github.com/WiredSnippets).

## 📄 License

[LGPL-3.0-or-later](./COPYING.LESSER), same as the original Shroom.
