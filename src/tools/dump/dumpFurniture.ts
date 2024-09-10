import path from "path";
import { promises as fs } from "fs";
import { createSpritesheet } from "./createSpritesheet";
import { FurnitureVisualizationData } from "../../objects/furniture/data/FurnitureVisualizationData";
import { FurnitureIndexData } from "../../objects/furniture/data/FurnitureIndexData";
import { FurnitureAssetsData } from "../../objects/furniture/data/FurnitureAssetsData";
import { ShroomAssetBundle } from "../../assets/ShroomAssetBundle";
import { FurnitureLogicData } from "../../objects/furniture/data/FurnitureLogicData";

export async function dumpFurniture(
  baseName: string,
  dumpLocation: string,
  imagePaths: string[]
) {
  const { json, image } = await createSpritesheet(imagePaths, {
    outputFormat: "png",
  });

  const visualizationData = await fs.readFile(
    path.join(dumpLocation, `${baseName}_visualization.bin`),
    "utf-8"
  );

  const indexData = await fs.readFile(
    path.join(dumpLocation, `index.bin`),
    "utf-8"
  );
  const assetsData = await fs.readFile(
    path.join(dumpLocation, `${baseName}_assets.bin`),
    "utf-8"
  );

  const logicData = await fs.readFile(
    path.join(dumpLocation, `${baseName}_logic.bin`),
    "utf-8"
  );

  const visualization = new FurnitureVisualizationData(visualizationData);
  const index = new FurnitureIndexData(indexData);
  const assets = new FurnitureAssetsData(assetsData);
  const logic = new FurnitureLogicData(logicData);

  const data = {
    spritesheet: json,
    visualization: visualization.toJson(),
    index: index.toJson(),
    assets: assets.toJson(),
    logic: logic.toJson(),
  };

  const logictest = logic.getLogics();
  console.log(logictest);

  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();

  const furnitureFile = new ShroomAssetBundle();
  furnitureFile.addFile("index.json", encoder.encode(jsonString));
  furnitureFile.addFile("spritesheet.png", image);

  await fs.writeFile(`${dumpLocation}.shroom`, furnitureFile.toBuffer());
}
