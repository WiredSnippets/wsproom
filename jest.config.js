module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true },
          target: "es2019"
        },
        module: { type: "commonjs" }
      }
    ],
    "^.+\\.(js|mjs)$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "ecmascript" },
          target: "es2019"
        },
        module: { type: "commonjs" }
      }
    ]
  },
  testEnvironment: "jsdom",
  setupFiles: ["jest-canvas-mock", "<rootDir>/src/__mocks__/setupTests.js"],
  transformIgnorePatterns: [
    "/node_modules/(?!\\.pnpm/)(?!(rbush|pixi\\.js|earcut|eventemitter3|@pixi)/)"
  ],
  moduleNameMapper: {
    "rbush": "<rootDir>/node_modules/rbush/rbush.js"
  }
};
