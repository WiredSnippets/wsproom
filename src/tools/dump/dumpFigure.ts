import { promises as fs } from "fs";
import * as path from "path";

import { WsproomAssetBundle } from "../../assets/WsproomAssetBundle";

export async function dumpFigure(
  baseName: string,
  dumpLocation: string,
  imagePaths: string[],
  xmlPaths: string[]
) {
  const imageFiles = await Promise.all(
    imagePaths.map((path) =>
      fs.readFile(path).then((buffer) => ({ path, buffer }))
    )
  );
  const binFiles = await Promise.all(
    xmlPaths.map((path) =>
      fs.readFile(path).then((buffer) => ({ path, buffer }))
    )
  );

  const file = new WsproomAssetBundle();

  imageFiles.forEach(({ path: filePath, buffer }) => {
    const baseName = path.basename(filePath);
    file.addFile(baseName, buffer);
  });

  binFiles.forEach(({ path: filePath, buffer }) => {
    const baseName = path.basename(filePath);
    file.addFile(baseName, buffer);
  });

  await fs.writeFile(`${dumpLocation}.wsproom`, file.toBuffer());
}
