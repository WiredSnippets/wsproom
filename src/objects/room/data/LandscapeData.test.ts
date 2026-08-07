import { LandscapeData } from "./LandscapeData";

const xml = `
<roomVisualization>
  <landscapeData>
    <textures>
      <texture id="tex_sky"><bitmap assetName="sky_bitmap" /></texture>
      <texture id="tex_sea"><bitmap assetName="sea_bitmap" /></texture>
    </textures>
    <materials>
      <material id="mat_sky">
        <matrix><column><cell textureId="tex_sky" /></column></matrix>
      </material>
      <material id="mat_sea">
        <matrix><column><cell textureId="tex_sea" /></column></matrix>
      </material>
    </materials>
    <planes>
      <plane id="landscape/1.1">
        <animatedVisualization size="32">
          <layers><layer materialId="mat_sky" /></layers>
        </animatedVisualization>
        <animatedVisualization size="64">
          <layers>
            <layer materialId="mat_sky" color="12632256" align="top" offset="4" />
            <layer materialId="mat_sea" align="bottom" />
            <animatedLayer>
              <item id="0" assetId="cloud_a" x="10%" randomX="80%" y="5%" speedX="-0.6" />
              <item id="1" assetId="cloud_b" x="50%" y="20%" speedX="-1.2" speedY="0" />
            </animatedLayer>
          </layers>
        </animatedVisualization>
      </plane>
    </planes>
  </landscapeData>
</roomVisualization>
`;

test("lists the landscape ids it found", () => {
  expect(new LandscapeData(xml).ids).toEqual(["landscape/1.1"]);
});

test("picks the requested size and resolves materials down to their bitmap", () => {
  const result = new LandscapeData(xml).getVisualization("landscape/1.1", 64);

  expect(result?.layers[0]).toEqual({
    material: "sky_bitmap",
    color: 12632256,
    align: "top",
    offset: 4,
  });
  expect(result?.layers[1]).toEqual({
    material: "sea_bitmap",
    color: undefined,
    align: "bottom",
    offset: undefined,
  });
});

test("turns percentage coordinates into fractions of the landscape", () => {
  const result = new LandscapeData(xml).getVisualization("landscape/1.1", 64);
  const items = result?.layers[2].items;

  expect(items?.[0]).toEqual({
    asset: "cloud_a",
    x: 0.1,
    y: 0.05,
    randomX: 0.8,
    randomY: 0,
    speedX: -0.6,
    speedY: 0,
  });
  expect(items?.[1].x).toBe(0.5);
  expect(items?.[1].speedX).toBe(-1.2);
});

test("falls back to whatever size exists when the wanted one is missing", () => {
  const result = new LandscapeData(xml).getVisualization("landscape/1.1", 999);
  expect(result?.layers).toHaveLength(1);
});

test("reports nothing rather than throwing on an unfamiliar document", () => {
  const other = new LandscapeData("<roomVisualization><wallData /></roomVisualization>");
  expect(other.ids).toEqual([]);
  expect(other.toJson()).toEqual({});
});
