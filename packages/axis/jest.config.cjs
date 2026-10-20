const path = require("node:path");

// Our own react-native copy, not whatever the workspace hoist resolves.
const reactNativeDir = path.dirname(
  require.resolve("react-native/package.json"),
);

// The package's React Native runner: the RN preset, `*.rntest.*`
// matching (vitest owns `*.test.*` under jsdom), and a cold-cache-sized
// timeout. Axis has no SVG or theme side effects, so no mocks or setup
// beyond the preset + act environment.
module.exports = {
  preset: "@react-native/jest-preset",
  testMatch: ["**/*.rntest.ts?(x)"],
  testTimeout: 120000,
  setupFiles: [path.join(__dirname, "jest.setup.cjs")],
  transformIgnorePatterns: [
    "/node_modules/(?!.*(@react-native|react-native)/)",
  ],
  moduleNameMapper: {
    "^react-native/setup-env$": `${reactNativeDir}/src/setup-env.js`,
    "^react-native($|/.*)": `${reactNativeDir}/$1`,
    "^react$": path.join(__dirname, "node_modules/react"),
    "^react/jsx-runtime$": path.join(
      __dirname,
      "node_modules/react/jsx-runtime",
    ),
    "^react/jsx-dev-runtime$": path.join(
      __dirname,
      "node_modules/react/jsx-dev-runtime",
    ),
  },
};
