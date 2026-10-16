// Jest transforms need an explicit babel config; the RN preset supplies the
// JSX + flow + ESM handling that `test:jest` relies on. Metro reads the same
// file (see scripts/check-metro.mjs), so the bundler and the test runner
// never drift.
module.exports = {
  presets: ["module:@react-native/babel-preset"],
};
