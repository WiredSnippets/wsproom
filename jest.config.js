module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
  },
  testEnvironment: "jsdom",
  setupFiles: ["jest-canvas-mock", "<rootDir>/src/__mocks__/setupTests.js"],
  transformIgnorePatterns: ["/node_modules/(?!rbush)"],
  moduleNameMapper: {
    "rbush": "<rootDir>/node_modules/rbush/rbush.js"
  }
};
