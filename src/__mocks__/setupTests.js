global.Image = class {
  constructor() {
    this.width = 0;
    this.height = 0;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock PIXI.Texture.from to avoid WebGL requirement in tests
jest.mock('pixi.js', () => {
  const actual = jest.requireActual('pixi.js');
  return {
    ...actual,
    Texture: {
      ...actual.Texture,
      from: (resource) => {
        const source = {
          resource,
          resolution: 1,
          pixelWidth: resource.width || 2,
          pixelHeight: resource.height || 2,
          scaleMode: "linear",
        };
        return {
          source,
          orig: { x: 0, y: 0 },
        };
      },
    },
  };
});
