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
      from: (source) => {
        const baseTexture = {
          resource: { source },
          resolution: 1,
          realWidth: source.width || 2,
          realHeight: source.height || 2,
        };
        return {
          baseTexture,
          orig: { x: 0, y: 0 },
        };
      },
    },
  };
});
