---
id: install
title: Installation
slug: /
---

### 1. Install the wsproom package

To install wsproom in your project, use the following command.

```
npm install @wiredsnippets/wsproom
```

If you are using `yarn`, you can use

```
yarn add @wiredsnippets/wsproom
```

### 2. Dump assets into your project

Run the following commands to dump the required assets into your project directory. This will take some time.
The `--url` option specifies the url to the external variables to use. The `--location` option specifies the location where the assets should get dumped into.
You can adjust both as needed.

```
npm install -g @wiredsnippets/wsproom
wsproom dump --url https://www.habbo.com/gamedata/external_variables/326b0a1abf9e2571d541ac05e6eb3173b83bddea --location ./public/resources
```

You will need to serve the created `resources` folder with a http server, so wsproom can access the required assets.

### 4. Create the Wsproom instance

Lastly, in your code, import and initialize the Wsproom instance.

```ts
import * as PIXI from "pixi.js";
import { Wsproom } from "@wiredsnippets/wsproom";

const view = document.querySelector("#root") as HTMLCanvasElement;
const application = new PIXI.Application({ view });

// Assuming the resources are available under http://localhost:8080/resources
const wsproom = Wsproom.create({ application, resourcePath: "./resources" });
```

Now, you are fully ready to use wsproom.
Check out the [Guides](guides/create-room.md) section to learn how to use wsproom.

Also, take a look at the [example project](https://github.com/WiredSnippets/wsproom/tree/master/example) in the wsproom repository for a basic project depending on wsproom.
You can use it as a boilerplate for your own.
