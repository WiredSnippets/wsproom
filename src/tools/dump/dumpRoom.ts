import path from "path";
import { promises as fs } from "fs";
import { createSpritesheet } from "./createSpritesheet";
import { ShroomAssetBundle } from "../../assets/ShroomAssetBundle";
import { LandscapeData } from "../../objects/room/data/LandscapeData";

/**
 * `room.swf` holds the room visualization data — the floor, wall and landscape
 * planes. We only pull the landscapes out of it for now, since that is what
 * shows through window furniture.
 */
export async function dumpRoom(
  baseName: string,
  dumpLocation: string,
  imagePaths: string[]
) {
  const candidates = [
    `${baseName}_visualization.bin`,
    `${baseName}_room_visualization.bin`,
    "room_visualization.bin",
    "visualization.bin",
  ];

  let xml: string | undefined;
  for (const candidate of candidates) {
    try {
      xml = await fs.readFile(path.join(dumpLocation, candidate), "utf-8");
      break;
    } catch {
      // try the next spelling
    }
  }

  if (xml == null) {
    const found = await fs.readdir(dumpLocation);
    throw new Error(
      `No room visualization xml in ${dumpLocation}. Found: ${found.join(", ")}`
    );
  }

  const landscapes = new LandscapeData(xml).toJson();
  const ids = Object.keys(landscapes);

  if (ids.length === 0) {
    throw new Error(
      `Parsed ${dumpLocation} but found no landscape planes — the xml layout is not the one this parser expects.`
    );
  }

  const { json, image } = await createSpritesheet(imagePaths, {
    outputFormat: "png",
  });

  const bundle = new ShroomAssetBundle();
  bundle.addFile(
    "index.json",
    new TextEncoder().encode(
      JSON.stringify({ spritesheet: json, landscapes })
    )
  );
  bundle.addFile("spritesheet.png", image);

  await fs.writeFile(`${dumpLocation}.wsproom`, bundle.toBuffer());

  console.log(`Dumped ${ids.length} landscapes: ${ids.join(", ")}`);
}
