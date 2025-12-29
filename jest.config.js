import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  verbose: true,
  testEnvironment: "node",
  testRegex: "/tests/.*\\.ts$",
  transform: {
    ...tsJestTransformCfg,
  },
};
