import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "bun:test";

const root = resolve(import.meta.dir, "..");
const readPackage = (path: string) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;

test("root package declares the Bun workspaces", () => {
  const manifest = readPackage("package.json");

  expect(manifest.packageManager).toBe("bun@1.3.8");
  expect(manifest.workspaces).toEqual(["apps/*", "packages/*"]);
});

test("the initial core workspace is private and MIT licensed", () => {
  const manifest = readPackage("packages/core/package.json");

  expect(manifest.name).toBe("@xoroh/axis-core");
  expect(manifest.private).toBe(true);
  expect(manifest.license).toBe("MIT");
  expect(manifest.publishConfig).toEqual({ access: "public" });
});
