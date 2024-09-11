import { extractSwfs } from "../../tools/dump/extractSwfs";
import { Logger } from "../../tools/dump/Logger";
import { dumpFurniture } from "../../tools/dump/dumpFurniture";
import { JSDOM } from "jsdom";

const logger: Logger = console;

const jsdom = new JSDOM();

global.DOMParser = jsdom.window.DOMParser;

const main = async () => {
  await extractSwfs(logger, "Furniture", ["./src/libs/@wiredsnippets/src/cli/test/wf_trg_says_something.swf"], dumpFurniture);
};

main();
