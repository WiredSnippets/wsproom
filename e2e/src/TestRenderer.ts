import * as PIXI from "pixi.js";

import { Wsproom } from "@wiredsnippets/wsproom";

export type TestRendererCleanup = () => void;

export type TestRenderer = (options: {
  wsproom: Wsproom;
  application: PIXI.Application;
}) => TestRendererCleanup | undefined | void;
