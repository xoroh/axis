import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const readPackage = (path: string) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<
    string,
    unknown
  >;

test("root package declares the Bun workspaces", () => {
  const manifest = readPackage("package.json");

  expect(manifest.packageManager).toBe("bun@1.3.8");
  expect(manifest.workspaces).toEqual(["apps/*", "packages/*"]);
});

test("the axis package is public, MIT licensed, and correctly addressed", () => {
  const manifest = readPackage("packages/axis/package.json");

  expect(manifest.name).toBe("@xoroh/axis");
  expect(manifest.private).toBe(undefined);
  expect(manifest.license).toBe("MIT");
  expect(manifest.publishConfig).toEqual({
    access: "public",
    provenance: true,
  });
  expect(manifest.repository).toMatchObject({
    url: "git+https://github.com/xoroh/axis.git",
    directory: "packages/axis",
  });
  expect(manifest.exports["."]).toBeDefined();
  expect(manifest.peerDependencies.react).toBeDefined();
});
