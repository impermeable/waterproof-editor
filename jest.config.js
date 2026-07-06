const { createDefaultEsmPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultEsmPreset({
  tsconfig: "tsconfig.test.json",
}).transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
    "^.*.js$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    "^.*.css$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  transformIgnorePatterns: ["/node_modules/(?!(@benrbray|katex)/)"],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__tests__/styleMock.js",
  },
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).?([mc])[jt]s?(x)"],
};
