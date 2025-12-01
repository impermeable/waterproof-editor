const { createDefaultEsmPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultEsmPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
    "^.*.js$": ["ts-jest"],
    "^.*.css$": ["ts-jest"]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@benrbray|katex)/)'
  ],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/__tests__/styleMock.js'
  }
};
