#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PKG_PATH = join(ROOT, "package.json");
const METRO_PATH = join(ROOT, "metro.config.js");
const APP_PATH = join(ROOT, "src", "App.tsx");
const AXIS_DIR = join(ROOT, "..", "..", "packages", "axis");

const failures = [];

// 1. Web dependencies
const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
if (!pkg.dependencies?.["react-dom"]) {
  failures.push("apps/example/package.json missing react-dom dependency.");
}
if (!pkg.dependencies?.["react-native-web"]) {
  failures.push(
    "apps/example/package.json missing react-native-web dependency.",
  );
}

// 2. Metro config with single-React pin
if (!existsSync(METRO_PATH)) {
  failures.push("apps/example/metro.config.js missing.");
} else {
  const metroContent = readFileSync(METRO_PATH, "utf8");
  if (!metroContent.includes("extraNodeModules")) {
    failures.push(
      "apps/example/metro.config.js must configure extraNodeModules to pin single-instance React.",
    );
  }
}

// 3. Single React instance assertion across workspace
const req = createRequire(import.meta.url);
try {
  const reactExample = req.resolve("react", { paths: [ROOT] });
  const reactAxis = req.resolve("react", { paths: [AXIS_DIR] });
  if (reactExample !== reactAxis) {
    failures.push(
      `Duplicate React detected:\n  example: ${reactExample}\n  axis:    ${reactAxis}`,
    );
  }
} catch (err) {
  failures.push(`Failed to resolve React instances: ${err.message}`);
}

// 4. App.tsx hook-safety assertion
const appContent = readFileSync(APP_PATH, "utf8");
if (appContent.includes("{demo.render()}")) {
  failures.push(
    "App.tsx calls {demo.render()} directly, which violates Rules of Hooks and breaks the dispatcher. Render as <DemoScreen />.",
  );
}

if (failures.length > 0) {
  console.error("check-web-bundle FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
} else {
  console.log(
    "web bundle assertions hold: web deps present, Metro single-React pinned, hooks safe.",
  );
}
