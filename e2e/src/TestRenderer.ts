import * as PIXI from "pixi.js";

import { Shroom } from "@wiredsnippets/shroom";

export type TestRendererCleanup = () => void;

export type TestRenderer = (options: {
  shroom: Shroom;
  application: PIXI.Application;
}) => TestRendererCleanup | undefined | void;
